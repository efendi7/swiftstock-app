/**
 * MemberCardPreview.tsx
 * Komponen kartu member yang bisa di-capture jadi PNG.
 * Dipakai di: WebSettings (preview) + MemberDetailModal (download/share)
 */
import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, TouchableOpacity,
  Alert, Platform, Linking,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Crown, Star, Award, Medal, Download, Share2, MessageCircle } from 'lucide-react-native';

import { Member } from '@/types/member.types';
import { MemberCardDesign } from '@/types/memberCard.types';
import { MemberCardService } from '@services/memberCardService';

interface Props {
  member:     Member;
  design:     MemberCardDesign;
  storeName:  string;
  logoUrl?:   string;
  tenantId:   string;
  // Mode preview (tanpa tombol aksi) untuk WebSettings
  previewMode?: boolean;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  'Reguler':  <Medal  size={14} color="#94A3B8" />,
  'Silver':   <Award  size={14} color="#64748B" />,
  'Gold':     <Star   size={14} color="#F59E0B" />,
  'Platinum': <Crown  size={14} color="#8B5CF6" />,
};

const MemberCardPreview: React.FC<Props> = ({
  member, design, storeName, logoUrl, tenantId, previewMode = false,
}) => {
  const cardRef = useRef<ViewShot>(null);

  const textColor = design.textColor === 'light' ? '#FFFFFF' : '#1E293B';
  const textColorMuted = design.textColor === 'light' ? 'rgba(255,255,255,0.7)' : '#64748B';

  const publicLink = MemberCardService.getMemberPublicLink(tenantId, member.id);

  // ── DOWNLOAD PNG ────────────────────────────────────────
  const handleDownload = async () => {
    try {
      // capture() returns base64 URI (data:image/png;base64,...)
      const uri = await (cardRef.current as any).capture();
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href     = uri;
        link.download = `member-card-${member.name.replace(/\s/g, '-')}.png`;
        link.click();
      } else {
        // Mobile: share langsung dari URI base64/temp — ViewShot sudah simpan ke temp
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Kartu Member' });
      }
    } catch (e) {
      Alert.alert('Gagal', 'Tidak bisa download kartu. Coba lagi.');
    }
  };

  // ── SHARE VIA WHATSAPP ───────────────────────────────────
  const handleWhatsApp = async () => {
    const url = MemberCardService.getWhatsAppShareText(
      member.name, storeName, publicLink, member.phone,
    );
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp tidak terinstall', 'Salin link berikut:\n' + publicLink);
    }
  };

  // ── SHARE LINK ───────────────────────────────────────────
  const handleShareLink = async () => {
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(publicLink);
        Alert.alert('Berhasil', 'Link kartu member disalin!');
      }
    } else {
      await Sharing.shareAsync(publicLink);
    }
  };

  // ── RENDER CARD ──────────────────────────────────────────
  const renderCard = () => (
    <View style={styles.card}>
      {/* Background */}
      {design.backgroundType === 'image' && design.backgroundImageUrl ? (
        <ImageBackground
          source={{ uri: design.backgroundImageUrl }}
          style={styles.cardBg}
          imageStyle={{ borderRadius: 16 }}
        >
          {renderCardContent()}
        </ImageBackground>
      ) : (
        <View style={[
          styles.cardBg,
          design.backgroundType === 'gradient'
            ? {}
            : { backgroundColor: design.backgroundColor }
        ]}>
          {design.backgroundType === 'gradient' && (
            // Gradient simulasi dengan 2 warna
            <View style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 16,
                backgroundColor: design.gradientColors?.[0] ?? design.backgroundColor,
              }
            ]}>
              <View style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 16,
                  backgroundColor: design.gradientColors?.[1] ?? design.backgroundColor,
                  opacity: 0.6,
                  top: '50%',
                }
              ]} />
            </View>
          )}
          {renderCardContent()}
        </View>
      )}
    </View>
  );

  const renderCardContent = () => (
    <View style={styles.cardContent}>
      {/* Header: logo + nama toko */}
      <View style={styles.cardHeader}>
        <View>
          {design.showLogo && logoUrl ? (
            <View style={styles.logoBox}>
              <Text style={[styles.logoText, { color: textColor }]}>
                {storeName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          ) : (
            <Text style={[styles.storeName, { color: textColor }]}>{storeName}</Text>
          )}
          <Text style={[styles.memberLabel, { color: textColorMuted }]}>MEMBER CARD</Text>
        </View>
        {/* Tier badge */}
        {design.showTier && (
          <View style={[styles.tierBadge, { borderColor: textColorMuted }]}>
            {TIER_ICONS[member.tier] ?? <Medal size={14} color={textColor} />}
            <Text style={[styles.tierText, { color: textColor }]}>{member.tier}</Text>
          </View>
        )}
      </View>

      {/* Dekoratif chip */}
      <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
        <View style={styles.chipDot} />
        <View style={[styles.chipLine, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
      </View>

      {/* Body: nama + QR */}
      <View style={styles.cardBody}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.memberName, { color: textColor }]} numberOfLines={1}>
            {member.name}
          </Text>
          {design.showPhone && (
            <Text style={[styles.memberPhone, { color: textColorMuted }]}>{member.phone}</Text>
          )}
          {design.showPoints && (
            <View style={styles.pointsRow}>
              <Star size={12} color={textColorMuted} />
              <Text style={[styles.pointsText, { color: textColorMuted }]}>
                {member.poin.toLocaleString('id-ID')} poin
              </Text>
            </View>
          )}
          {design.showExpiry && (
            <Text style={[styles.expiryText, { color: textColorMuted }]}>
              {design.expiryMonths === 0
                ? 'Berlaku: Seumur Hidup'
                : `Berlaku: ${design.expiryMonths} bulan`}
            </Text>
          )}
        </View>

        {/* QR Code */}
        <View style={styles.qrBox}>
          <QRCode
            value={publicLink}
            size={72}
            backgroundColor="white"
            color="#1E293B"
          />
        </View>
      </View>

      {/* Member ID */}
      <Text style={[styles.memberId, { color: textColorMuted }]}>
        ID: {member.id.slice(0, 8).toUpperCase()}
      </Text>
    </View>
  );

  return (
    <View>
      {/* Kartu yang bisa di-capture */}
      <ViewShot ref={cardRef} options={{ format: 'png', quality: 1.0 }}>
        {renderCard()}
      </ViewShot>

      {/* Action buttons — disembunyikan di preview mode */}
      {!previewMode && (
        <View style={styles.actions}>
          <ActionBtn
            icon={<Download size={15} color="#FFF" />}
            label="Download"
            color="#3B82F6"
            onPress={handleDownload}
          />
          <ActionBtn
            icon={<MessageCircle size={15} color="#FFF" />}
            label="WhatsApp"
            color="#10B981"
            onPress={handleWhatsApp}
          />
          <ActionBtn
            icon={<Share2 size={15} color="#FFF" />}
            label="Salin Link"
            color="#8B5CF6"
            onPress={handleShareLink}
          />
        </View>
      )}
    </View>
  );
};

const ActionBtn = ({ icon, label, color, onPress }: {
  icon: React.ReactNode; label: string; color: string; onPress: () => void;
}) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
    {icon}
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card:          { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  cardBg:        { width: 340, height: 200, borderRadius: 16, overflow: 'hidden' },
  cardContent:   { flex: 1, padding: 20, justifyContent: 'space-between' },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logoBox:       { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoText:      { fontSize: 14, fontFamily: 'PoppinsBold' },
  storeName:     { fontSize: 16, fontFamily: 'PoppinsBold' },
  memberLabel:   { fontSize: 9, fontFamily: 'PoppinsMedium', letterSpacing: 1.5, marginTop: 2 },
  tierBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tierText:      { fontSize: 11, fontFamily: 'PoppinsBold' },
  chip:          { width: 48, height: 32, borderRadius: 6, padding: 6, marginVertical: 4 },
  chipDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  chipLine:      { height: 2, borderRadius: 1, width: '100%' },
  cardBody:      { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  memberName:    { fontSize: 16, fontFamily: 'PoppinsBold', marginBottom: 2 },
  memberPhone:   { fontSize: 11, fontFamily: 'PoppinsRegular', marginBottom: 4 },
  pointsRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsText:    { fontSize: 11, fontFamily: 'PoppinsRegular' },
  expiryText:    { fontSize: 10, fontFamily: 'PoppinsRegular', marginTop: 4 },
  qrBox:         { backgroundColor: '#FFF', borderRadius: 8, padding: 4 },
  memberId:      { fontSize: 9, fontFamily: 'PoppinsMedium', letterSpacing: 1 },
  actions:       { flexDirection: 'row', gap: 8, marginTop: 14, justifyContent: 'center' },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { fontSize: 12, fontFamily: 'PoppinsBold', color: '#FFF' },
});

export default MemberCardPreview;