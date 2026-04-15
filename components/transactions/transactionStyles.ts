import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  // --- MODAL LAYOUT ---
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15,23,42,0.6)', 
  },
  modalContent: { 
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: { fontSize: 20, fontFamily: 'PoppinsBold', color: '#1E293B' },
  closeBtn: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 14 },
  
  // --- WEB GRID SYSTEM (RATA KANAN KIRI) ---
  webGridContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 24,
  },
  column: {
    flex: 1, // Membagi 50-50 secara rata
  },

  // --- BODY & CONTENT ---
  scrollContent: { paddingBottom: 40 },
  modalBody: { padding: 24 },
  infoCard: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9' // Mengganti garis kiri dengan border halus di semua sisi
  },
  sectionTitle: { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 16 },
  
  // --- PRODUCT ITEM CARD ---
  productCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  productHeader: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  productIndex: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#64748B', marginRight: 6 },
  productName: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B', flex: 1 },
  productDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  productDetailLabel: { fontSize: 12, color: '#64748B', fontFamily: 'PoppinsRegular' },
  productDetailValue: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#1E293B' },
  productSubtotalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    paddingTop: 10,
    marginTop: 6
  },
  productSubtotalLabel: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  productSubtotalValue: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#10B981' },

  // --- INFO ROW UTILS ---
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  infoLabel: { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#64748B' },
  infoValue: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },

  // --- PAYMENT SUMMARY ---
  paymentSummaryCard: { borderRadius: 24, padding: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'PoppinsMedium' },
  summaryValue: { color: '#FFF', fontFamily: 'PoppinsSemiBold', fontSize: 15 },
  summaryValueBig: { color: '#FFF', fontSize: 26, fontFamily: 'PoppinsBold' },
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 15 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
});