import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert, 
  Platform, Animated, TouchableWithoutFeedback, Dimensions
} from 'react-native';
import { Info, Save, X, ClipboardCheck } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

interface StockOpnameModalProps {
  visible: boolean;
  onClose: () => void;
  currentStock: number;
  productName: string;
  onSave: (physicalStock: number, reason: string) => Promise<void>;
}

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export const StockOpnameModal = ({ 
  visible, onClose, currentStock, productName, onSave 
}: StockOpnameModalProps) => {
  const [physicalStock, setPhysicalStock] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      setPhysicalStock('');
      setReason('');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const diff = physicalStock !== '' ? parseInt(physicalStock) - currentStock : 0;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleSave = async () => {
    if (physicalStock === '' || isNaN(parseInt(physicalStock))) {
      return Alert.alert('Gagal', 'Silakan masukkan jumlah stok fisik yang valid!');
    }
    setLoading(true);
    try {
      await onSave(parseInt(physicalStock), reason);
      handleClose();
    } catch (error) {
      // Error ditangani di parent (EditProductModal)
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View 
          style={[
            styles.modalCard, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              width: isWeb ? Math.min(480, width * 0.9) : '90%' 
            }
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <ClipboardCheck size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.title}>Stock Opname</Text>
                <Text style={styles.subTitle} numberOfLines={1}>{productName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeCircle}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* STOCK COMPARISON */}
          <View style={styles.comparisonContainer}>
            <View style={styles.stockBox}>
              <Text style={styles.label}>STOK SISTEM</Text>
              <Text style={styles.systemValue}>{currentStock}</Text>
            </View>
            
            <View style={styles.dividerBox}>
              <Text style={styles.arrow}>→</Text>
            </View>

            <View style={[styles.stockBox, styles.activeBox]}>
              <Text style={[styles.label, { color: COLORS.primary }]}>STOK FISIK</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="0"
                autoFocus={isWeb}
                value={physicalStock}
                onChangeText={(v) => setPhysicalStock(v.replace(/[^0-9]/g, ''))}
              />
            </View>
          </View>

          {/* STATUS SELECTOR / DIFF INFO */}
          <View style={[
            styles.diffIndicator, 
            diff < 0 ? styles.bgRed : diff > 0 ? styles.bgGreen : styles.bgGray
          ]}>
            <Info size={16} color={diff < 0 ? '#ef4444' : diff > 0 ? '#10b981' : '#64748B'} />
            <Text style={[
              styles.diffText, 
              { color: diff < 0 ? '#b91c1c' : diff > 0 ? '#15803d' : '#475569' }
            ]}>
              Selisih: <Text style={styles.bold}>{diff > 0 ? '+' : ''}{diff}</Text> 
              {diff === 0 ? ' (Sesuai)' : diff > 0 ? ' (Kelebihan/Surplus)' : ' (Kurang/Defisit)'}
            </Text>
          </View>

          {/* REASON INPUT */}
          <Text style={styles.inputLabel}>Keterangan Penyesuaian</Text>
          <TextInput 
            style={styles.textArea} 
            placeholder="Contoh: Barang rusak, salah input, atau kadaluarsa..." 
            multiline
            numberOfLines={3}
            value={reason}
            onChangeText={setReason}
          />

          {/* FOOTER ACTIONS */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
              onPress={handleSave} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Simpan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 24 
  },
  headerTitleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1
  },
  iconCircle: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { 
    fontFamily: 'PoppinsBold', 
    fontSize: 18,
    color: '#1E293B'
  },
  subTitle: { 
    fontFamily: 'PoppinsRegular', 
    fontSize: 13, 
    color: '#64748B',
    marginTop: -2
  },
  closeCircle: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 20
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20
  },
  stockBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  activeBox: {
    backgroundColor: '#FFF',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dividerBox: {
    justifyContent: 'center'
  },
  arrow: {
    fontSize: 20,
    color: '#CBD5E1',
    fontWeight: 'bold'
  },
  label: { 
    fontSize: 10, 
    color: '#94A3B8', 
    fontFamily: 'PoppinsBold',
    letterSpacing: 1,
    marginBottom: 4
  },
  systemValue: { 
    fontSize: 24, 
    fontFamily: 'PoppinsBold',
    color: '#475569'
  },
  input: { 
    fontSize: 24, 
    fontFamily: 'PoppinsBold', 
    color: COLORS.primary, 
    width: '100%', 
    textAlign: 'center',
    padding: 0
  },
  diffIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 20 
  },
  bgRed: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' }, 
  bgGreen: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7' }, 
  bgGray: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
  diffText: { fontSize: 13, fontFamily: 'PoppinsMedium' },
  bold: { fontFamily: 'PoppinsBold' },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4
  },
  textArea: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 16, 
    height: 100, 
    textAlignVertical: 'top', 
    marginBottom: 24, 
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  footer: {
    flexDirection: 'row',
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9'
  },
  cancelBtnText: {
    fontFamily: 'PoppinsSemiBold',
    color: '#64748B'
  },
  saveBtn: { 
    flex: 2,
    backgroundColor: COLORS.primary, 
    paddingVertical: 14, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10 
  },
  saveBtnText: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 }
});