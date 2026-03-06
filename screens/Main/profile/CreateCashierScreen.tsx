// src/screens/Auth/CreateCashierScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { registerUser } from '../../../services/authService';
import { COLORS } from '../../../constants/colors';
import FloatingLabelInput from '../../../components/FloatingLabelInput';
import ErrorModal from '../../auth/ErrorModal';

type CreateCashierNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateCashier'
>;

const CreateCashierScreen = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const navigation = useNavigation<CreateCashierNavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showErrorModal = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const handleCreateCashier = async () => {
    // Validasi
    if (!displayName.trim()) {
      showErrorModal('Nama Kosong', 'Silakan masukkan nama kasir.');
      return;
    }

    if (!email.trim()) {
      showErrorModal('Email Kosong', 'Silakan masukkan alamat email kasir.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showErrorModal(
        'Email Tidak Valid',
        'Format email yang Anda masukkan tidak valid.',
      );
      return;
    }

    if (!password || password.length < 6) {
      showErrorModal('Password Terlalu Pendek', 'Password minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      showErrorModal('Password Tidak Cocok', 'Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(email.trim(), password, displayName.trim());

      // Tampilkan success message
      setSuccessMessage('Akun kasir berhasil dibuat!');

      // Reset form
      setDisplayName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Auto hide success message dan kembali
      setTimeout(() => {
        setSuccessMessage('');
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      let errorTitle = 'Gagal Membuat Akun';
      let errorMessage = 'Terjadi kesalahan saat membuat akun kasir.';

      if (error.code === 'auth/email-already-in-use') {
        errorTitle = 'Email Sudah Terdaftar';
        errorMessage = 'Email ini sudah digunakan. Gunakan email lain.';
      } else if (error.code === 'auth/weak-password') {
        errorTitle = 'Password Lemah';
        errorMessage =
          'Password terlalu lemah. Gunakan kombinasi huruf dan angka.';
      } else if (error.code === 'auth/network-request-failed') {
        errorTitle = 'Koneksi Bermasalah';
        errorMessage =
          'Tidak dapat terhubung ke server. Periksa koneksi internet.';
      }

      showErrorModal(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <Text style={styles.title}>Buat Akun Kasir</Text>
          <Text style={styles.subtitle}>
            Tambahkan akun baru untuk staff kasir Anda
          </Text>

          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <FloatingLabelInput
            label="Nama Lengkap"
            value={displayName}
            onChangeText={setDisplayName}
            icon={<User size={20} color={COLORS.textLight} />}
            editable={!isLoading}
          />

          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={20} color={COLORS.textLight} />}
            editable={!isLoading}
          />

          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock size={20} color={COLORS.textLight} />}
            editable={!isLoading}
          />

          <FloatingLabelInput
            label="Konfirmasi Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon={<Lock size={20} color={COLORS.textLight} />}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[
              styles.createButton,
              isLoading && styles.createButtonDisabled,
            ]}
            onPress={handleCreateCashier}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.createButtonText}>Buat Akun Kasir</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>
            * Akun yang dibuat akan memiliki role "Kasir" dan dapat langsung
            digunakan untuk transaksi.
          </Text>
        </Animated.View>
      </ScrollView>

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, visible: false })}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardBg,
    borderRadius: 25,
    padding: 25,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 26,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'MontserratBold',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'PoppinsRegular',
  },
  successBanner: {
    backgroundColor: '#D4EDDA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  successText: {
    color: '#155724',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'PoppinsRegular',
  },
  createButton: {
    backgroundColor: COLORS.accent,
    height: 55,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
  },
  noteText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 15,
    textAlign: 'center',
    fontFamily: 'PoppinsRegular',
    fontStyle: 'italic',
  },
});

export default CreateCashierScreen;
