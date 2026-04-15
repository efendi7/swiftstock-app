/**
 * useCashier.ts — semua state & logic CashierScreen
 * Screen dan modal hanya terima return value hook ini.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@services/firebaseConfig';
import { handleCheckout } from '@services/transactionService';
import {
  MemberService, calculatePointsEarned,
  calculateRedeemAmount, getActiveDiscount,
} from '@services/memberService';
import { Member, TransactionMember } from '@/types/member.types';
import { useAuth } from '@hooks/auth/useAuth';
import { useMemberSettings } from '@hooks/useMemberSettings';

// ── Types ─────────────────────────────────────────────────

export interface CartProduct { id: string; name: string; barcode: string; price: number; stock: number }
export interface CartItem extends CartProduct { qty: number }
export type PaymentMethod = 'cash' | 'qris';

export interface MemberState {
  member: Member;
  discount: number; discountAmt: number;
  pointsEarned: number;
  useRedeem: boolean;
  redeemAmt: number;       // nilai Rp yang benar-benar dipotong (sudah di-cap)
  pointsRedeemed: number;  // poin yang benar-benar terpakai (sudah di-cap)
  finalTotal: number;
}

interface PendingNewMember { phone: string; name: string; isProspect: boolean; extraFee: number }

// ── Hook ──────────────────────────────────────────────────

export const useCashier = () => {
  const { tenantId, user }                  = useAuth();
  const { settings: memberSettings, tiers } = useMemberSettings(tenantId);

  const [cart,    setCart]    = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod>('cash');
  const [cashAmount,       setCashAmount]       = useState('');
  const [changeAmount,     setChangeAmount]     = useState(0);

  const [phoneInput,        setPhoneInput]        = useState('');
  const [memberState,       setMemberState]       = useState<MemberState | null>(null);
  const [memberLoading,     setMemberLoading]     = useState(false);
  const [memberError,       setMemberError]       = useState('');
  const [showMemberScanner, setShowMemberScanner] = useState(false);

  const [showNamePrompt,    setShowNamePrompt]    = useState(false);
  const [pendingMemberName, setPendingMemberName] = useState('');
  const [nameInputError,    setNameInputError]    = useState('');
  const [regFeePrompt,      setRegFeePrompt]      = useState(false);
  const [registrationFee,   setRegistrationFee]   = useState(0);
  const [pendingPayFee,     setPendingPayFee]     = useState(false);
  const [pendingPhone,      setPendingPhone]      = useState('');
  const [pendingNewMember,  setPendingNewMember]  = useState<PendingNewMember | null>(null);

  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const finalTotal = memberState?.finalTotal ?? subtotal;

  // ── Member helpers ────────────────────────────────────────

  const buildMemberState = useCallback((member: Member, sub: number, useRedeem: boolean): MemberState => {
    if (member.isProspect)
      return { member, discount: 0, discountAmt: 0, pointsEarned: 0, useRedeem: false, redeemAmt: 0, pointsRedeemed: 0, finalTotal: sub };
    const discount    = getActiveDiscount(member, tiers);
    const discountAmt = Math.floor(sub * discount / 100);
    const afterDisc   = sub - discountAmt;

    // Nilai redeem penuh berdasarkan semua poin member
    const fullRedeemAmt = useRedeem && member.poin > 0
      ? calculateRedeemAmount(member.poin, memberSettings.redeemRate) : 0;

    // Cap: redeem tidak boleh melebihi sisa setelah diskon
    const redeemAmt     = Math.min(fullRedeemAmt, afterDisc);

    // Hitung poin yang benar-benar terpakai (proporsional jika di-cap)
    // redeemRate = nilai Rp per 1 poin
    const pointsRedeemed = memberSettings.redeemRate > 0
      ? Math.ceil(redeemAmt / memberSettings.redeemRate)
      : 0;

    return {
      member, discount, discountAmt,
      pointsEarned: memberSettings.pointsPerRupiah > 0
        ? calculatePointsEarned(sub, memberSettings.pointsPerRupiah) : 0,
      useRedeem, redeemAmt, pointsRedeemed,
      finalTotal: Math.max(0, afterDisc - redeemAmt),
    };
  }, [tiers, memberSettings]);

  const recalcMember = (newSub: number, ms: MemberState | null) => {
    if (ms) setMemberState(buildMemberState(ms.member, newSub, ms.useRedeem));
  };

  /**
   * Cek apakah member boleh redeem poin saat ini.
   * Return { allowed, reason } — reason dipakai untuk pesan di UI.
   */
  const checkRedeemEligibility = (member: Member): { allowed: boolean; reason?: string } => {
    const { minRedeemPoin, redeemCooldown, redeemRate } = memberSettings;

    // Minimum poin
    if (minRedeemPoin > 0 && member.poin < minRedeemPoin) {
      return {
        allowed: false,
        reason: `Minimal ${minRedeemPoin} poin untuk redeem (kamu punya ${member.poin} poin)`,
      };
    }

    // Cooldown
    if (redeemCooldown !== 'none' && member.lastRedeemAt) {
      const last    = member.lastRedeemAt.toDate();
      const now     = new Date();
      const diffMs  = now.getTime() - last.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      const limitDays = redeemCooldown === 'daily' ? 1
        : redeemCooldown === 'weekly'  ? 7
        : 30; // monthly

      if (diffDays < limitDays) {
        const nextDate = new Date(last.getTime() + limitDays * 24 * 60 * 60 * 1000);
        const fmt = nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const periodLabel = redeemCooldown === 'daily' ? 'hari ini'
          : redeemCooldown === 'weekly' ? 'minggu ini' : 'bulan ini';
        return {
          allowed: false,
          reason: `Sudah redeem ${periodLabel}. Bisa redeem lagi mulai ${fmt}`,
        };
      }
    }

    return { allowed: true };
  };

  // ── Cart ──────────────────────────────────────────────────

  const addToCart = (product: CartProduct) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) {
        if (exist.qty + 1 > product.stock) { Alert.alert('Stok Terbatas', `Sisa: ${product.stock}`); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      if (product.stock < 1) { Alert.alert('Stok Habis', 'Produk tidak tersedia.'); return prev; }
      return [...prev, { ...product, qty: 1 }];
    });
    recalcMember(cart.reduce((s, i) => s + i.price * i.qty, 0) + product.price, memberState);
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) {
      Alert.alert('Hapus Item?', '', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => setCart(prev => {
          const next = prev.filter(i => i.id !== id);
          recalcMember(next.reduce((s, i) => s + i.price * i.qty, 0), memberState);
          return next;
        })},
      ]);
      return;
    }
    const item = cart.find(i => i.id === id);
    if (item && qty > item.stock) { Alert.alert('Stok Tidak Cukup', `Maks: ${item.stock}`); return; }
    setCart(prev => {
      const next = prev.map(i => i.id === id ? { ...i, qty } : i);
      recalcMember(next.reduce((s, i) => s + i.price * i.qty, 0), memberState);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]); setMemberState(null); setPhoneInput('');
    setPendingNewMember(null); setCashAmount(''); setChangeAmount(0); setPaymentMethod('cash');
  };

  // ── Barcode lookup ────────────────────────────────────────

  const getProductByBarcode = async (barcode: string) => {
    if (!tenantId) { Alert.alert('Error', 'Sesi tidak valid.'); return; }
    try {
      setLoading(true);
      const snap = await getDocs(query(
        collection(db, 'tenants', tenantId, 'products'),
        where('barcode', '==', barcode.trim()),
      ));
      if (snap.empty) { Alert.alert('Produk Tidak Ada', `Barcode ${barcode} tidak terdaftar.`); return; }
      const d = snap.docs[0];
      addToCart({ id: d.id, ...d.data() } as CartProduct);
    } catch { Alert.alert('Error', 'Gagal mencari produk.'); }
    finally   { setLoading(false); }
  };

  // ── Member search & registration ──────────────────────────

  /** Dipanggil dari MemberSearchSelect saat item dipilih dari dropdown */
  const handleSelectMember = (member: Member) => {
    setPhoneInput(member.phone);
    setMemberError('');
    setMemberState(buildMemberState(member, subtotal, false));
  };

  const handleSearchMember = async () => {
    if (!tenantId || !phoneInput.trim()) return;
    setMemberError(''); setMemberLoading(true);
    try {
      const found = await MemberService.findByPhone(tenantId, phoneInput.trim());
      if (found) { setMemberState(buildMemberState(found, subtotal, false)); return; }
      if (memberSettings.membershipModel === 'opt-in') {
        setMemberError('Member tidak ditemukan. Daftarkan via halaman Member.');
      } else if (memberSettings.membershipModel === 'conditional' && (memberSettings.conditionalFee ?? 0) > 0) {
        setRegistrationFee(memberSettings.conditionalFee ?? 0);
        setPendingPhone(phoneInput.trim()); setRegFeePrompt(true);
      } else {
        setPendingPhone(phoneInput.trim()); setPendingMemberName(''); setNameInputError(''); setShowNamePrompt(true);
      }
    } catch { setMemberError('Gagal mencari member. Coba lagi.'); }
    finally   { setMemberLoading(false); }
  };

  const doRegisterMember = (phone: string, name: string, extraFee = 0) => {
    const isProspect = memberSettings.membershipModel === 'conditional' && extraFee === 0;
    const tempMember: Member = {
      id: 'pending', name, phone, email: '', poin: 0,
      tier: 'Reguler', totalSpend: 0, totalVisits: 0,
      discountOverride: null, isProspect,
      createdAt: { toDate: () => new Date() } as any,
    };
    setPendingNewMember({ phone, name, isProspect, extraFee });
    const ms = buildMemberState(tempMember, subtotal, false);
    setMemberState(extraFee > 0 ? { ...ms, finalTotal: ms.finalTotal + extraFee } : ms);
  };

  const handleConfirmName = () => {
    if (!pendingMemberName.trim()) { setNameInputError('Nama tidak boleh kosong'); return; }
    setShowNamePrompt(false);
    doRegisterMember(pendingPhone, pendingMemberName.trim(), pendingPayFee ? registrationFee : 0);
    setPendingPhone(''); setRegistrationFee(0); setPendingPayFee(false);
  };

  const handleCancelRegFee = () => {
    setRegFeePrompt(false); setPendingPhone(''); setRegistrationFee(0); setPendingPayFee(false);
    setMemberError('Customer tidak jadi daftar member.');
  };

  const handleRemoveMember  = () => { setMemberState(null); setPhoneInput(''); setMemberError(''); setPendingNewMember(null); };
  const handleToggleRedeem  = () => { if (memberState) setMemberState(buildMemberState(memberState.member, subtotal, !memberState.useRedeem)); };

  const handleMemberQRScanned = async (data: string) => {
    setShowMemberScanner(false);
    if (!tenantId) return;
    setMemberLoading(true); setMemberError('');
    try {
      let resolved: Member | null = null;
      const urlMatch = data.match(/\/member\/([^/]+)\/([^/?\s]+)/);
      if (urlMatch) {
        // QR dari kartu member (URL format)
        if (urlMatch[1] !== tenantId) { setMemberError('Kartu member bukan milik toko ini.'); return; }
        resolved = await MemberService.getById(tenantId, urlMatch[2]);
      } else if (/^\d{8,}$/.test(data.trim())) {
        // Angka panjang → coba nomor HP dulu
        resolved = await MemberService.findByPhone(tenantId, data.trim());
        if (!resolved) resolved = await MemberService.findByQR(tenantId, data.trim());
      } else {
        // Barcode / doc ID
        resolved = await MemberService.findByQR(tenantId, data.trim());
        if (!resolved) resolved = await MemberService.findByPhone(tenantId, data.trim());
      }
      if (resolved) { setPhoneInput(resolved.phone); setMemberState(buildMemberState(resolved, subtotal, false)); }
      else setMemberError('Member tidak ditemukan dari QR ini.');
    } catch { setMemberError('Gagal membaca QR member.'); }
    finally   { setMemberLoading(false); }
  };

  // ── Conditional upgrade ───────────────────────────────────

  const checkConditionalUpgrade = async (memberId: string, newVisits: number, newSpend: number) => {
    if (!tenantId || memberSettings.membershipModel !== 'conditional') return;
    const { conditionalLogic, minVisits, minTotalSpend } = memberSettings;
    const ok = conditionalLogic === 'OR'
      ? newVisits >= (minVisits || 3) || newSpend >= (minTotalSpend || 100_000)
      : newVisits >= (minVisits || 3) && newSpend >= (minTotalSpend || 100_000);
    if (ok) await MemberService.updateMember(tenantId, memberId, { isProspect: false });
  };

  // ── Payment ───────────────────────────────────────────────

  const handleCashChange = (text: string) => {
    const amount = parseInt(text.replace(/\D/g, '')) || 0;
    setCashAmount(text);
    setChangeAmount(amount - finalTotal);
  };

  // ── Checkout ──────────────────────────────────────────────

  const onCheckout = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !tenantId) return;
    try {
      setLoading(true);
      const isNewPending  = memberState?.member.id === 'pending';
      const finalCash     = paymentMethod === 'qris' ? finalTotal : (parseInt(cashAmount.replace(/\D/g, '')) || 0);
      const finalChange   = paymentMethod === 'qris' ? 0 : changeAmount;

      const memberData: (TransactionMember & { finalTotal: number }) | null =
        memberState && !isNewPending ? {
          memberId:        memberState.member.id,
          memberName:      memberState.member.name,
          memberPhone:     memberState.member.phone,
          tierName:        memberState.member.tier,
          discountPercent: memberState.discount,
          discountAmount:  memberState.discountAmt,
          pointsEarned:    memberState.pointsEarned,
          pointsRedeemed:  memberState.pointsRedeemed,
          redeemAmount:    memberState.redeemAmt,
          finalTotal,
        } : null;

      const result = await handleCheckout({
        cart, subtotal, user: firebaseUser,
        cash: finalCash, change: finalChange,
        paymentMethod, tenantId,
        cashierName: user?.displayName,
        member: memberData,
        ...(isNewPending && { subtotal: finalTotal }),
      });

      // Commit pending member setelah transaksi sukses
      let committedId: string | null = isNewPending ? null : (memberState?.member.id ?? null);
      if (pendingNewMember) {
        committedId = await commitPendingMember(tenantId, pendingNewMember, finalTotal, result.transactionId);
        setPendingNewMember(null);
      }

      if (committedId && (memberState?.member.isProspect || isNewPending)) {
        const visits = isNewPending ? 1 : (memberState?.member.totalVisits || 0) + 1;
        const spend  = isNewPending ? finalTotal : (memberState?.member.totalSpend || 0) + finalTotal;
        await checkConditionalUpgrade(committedId, visits, spend);
      }

      const poinMsg = memberState && !memberState.member.isProspect
        ? `\n${memberState.member.name} dapat +${memberState.pointsEarned} poin` : '';

      Alert.alert('Sukses', `Transaksi ${result.transactionNumber} berhasil!${poinMsg}`, [
        { text: 'Selesai', onPress: () => { setShowPaymentModal(false); clearCart(); } },
      ]);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan');
    } finally { setLoading(false); }
  };

  // ── UI flags ──────────────────────────────────────────────

  const canConfirm      = paymentMethod === 'qris' || (!!cashAmount && changeAmount >= 0);
  const showMemberInput = memberSettings.membershipModel !== 'opt-in';
  const memberBlocking  = memberSettings.membershipModel === 'auto-capture' && !memberState && !phoneInput.trim();
  const getTierColor    = (tier: string) => tiers.find(t => t.name === tier)?.color ?? '#94A3B8';

  return {
    cart, loading, subtotal, finalTotal,
    showPaymentModal, setShowPaymentModal,
    paymentMethod, setPaymentMethod,
    cashAmount, changeAmount,
    phoneInput, setPhoneInput,
    memberState, memberLoading, memberError,
    showMemberScanner, setShowMemberScanner,
    showNamePrompt, setShowNamePrompt,
    pendingMemberName, setPendingMemberName,
    nameInputError, setNameInputError,
    regFeePrompt, registrationFee,
    pendingNewMember, pendingPayFee, setPendingPayFee,
    getProductByBarcode, addToCart, updateQty,
    handleCashChange, handleSearchMember, handleSelectMember, handleConfirmName,
    handleCancelRegFee, handleRemoveMember, handleToggleRedeem,
    handleMemberQRScanned, onCheckout,
    canConfirm, showMemberInput, memberBlocking,
    getTierColor, memberSettings,
    checkRedeemEligibility,
  };
};

// ── Private helper ────────────────────────────────────────

const commitPendingMember = async (
  tenantId: string, pending: PendingNewMember,
  totalSpend: number, transactionId: string,
): Promise<string> => {
  const { phone, name, isProspect } = pending;
  const savedId = await MemberService.addMember(tenantId, { name, phone, isProspect });
  await MemberService.updateMember(tenantId, savedId, { totalSpend, totalVisits: 1 });
  if (transactionId) {
    updateDoc(doc(db, 'tenants', tenantId, 'transactions', transactionId), {
      member: {
        memberId: savedId, memberName: name, memberPhone: phone,
        tierName: isProspect ? 'Calon Member' : 'Reguler',
        discountPercent: 0, discountAmount: 0,
        pointsEarned: 0, pointsRedeemed: 0, redeemAmount: 0,
      },
    }).catch((e: any) => console.warn('[commitPendingMember] patch gagal:', e));
  }
  return savedId;
};