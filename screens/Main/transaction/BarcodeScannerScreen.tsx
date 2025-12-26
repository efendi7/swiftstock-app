import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { COLORS } from '../../../constants/colors'; // Pastikan path ini benar

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = 250;

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScannerScreen: React.FC<BarcodeScannerProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (visible && isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: SCAN_AREA_SIZE - 2,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, isScanning]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanning) return;
    setIsScanning(false);
    onScan(data);
    onClose();
    setTimeout(() => setIsScanning(true), 1500);
  };

  if (hasPermission === null || hasPermission === false) {
    return (
      <Modal visible={visible} animationType="fade">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            {hasPermission === null ? 'Meminta izin kamera...' : 'Akses Kamera Ditolak'}
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: COLORS.primary }]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'code128', 'qr'],
          }}
        />

        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={[styles.focusedContainer, { borderColor: COLORS.success }]}>
              
              <Animated.View 
                style={[
                  styles.scanLine, 
                  { backgroundColor: COLORS.success, transform: [{ translateY: scanLineAnim }] }
                ]} 
              />
              
              <View style={[styles.corner, styles.topLeft, { borderColor: COLORS.success }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: COLORS.success }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: COLORS.success }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: COLORS.success }]} />
            </View>
            <View style={styles.unfocusedContainer} />
          </View>

          <View style={styles.bottomContainer}>
            <Text style={[styles.instructionText, { color: COLORS.white }]}>
              Arahkan ke Barcode / QR Code
            </Text>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: COLORS.white }]} 
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: COLORS.white }]}>Batalkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.background, // Pakai background konstanta
    padding: 20 
  },
  permissionText: { 
    fontSize: 18, 
    fontFamily: 'PoppinsSemiBold', 
    color: COLORS.textDark, // Pakai textDark konstanta
    marginBottom: 20 
  },
  overlay: { flex: 1 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  focusedContainer: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, position: 'relative' },
  scanLine: { width: '100%', height: 2, position: 'absolute' },
  corner: { position: 'absolute', width: 40, height: 40 },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 15 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 15 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 15 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 15 },
  bottomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', paddingTop: 40 },
  instructionText: { fontSize: 15, fontFamily: 'PoppinsMedium', marginBottom: 30 },
  button: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 },
  buttonText: { color: COLORS.white, fontFamily: 'PoppinsSemiBold' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 50, borderRadius: 30, borderWidth: 1 },
  cancelButtonText: { fontSize: 14, fontFamily: 'PoppinsSemiBold' },
});

export default BarcodeScannerScreen;