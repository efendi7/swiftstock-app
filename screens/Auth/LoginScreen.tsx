import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { loginUser, sendPasswordReset } from '../../services/authService';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import ErrorModal from './ErrorModal';
import ResetPasswordModal from './ResetPasswordModal';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const showErrorModal = (title: string, message: string) => {
    shakeAnimation();
    setErrorModal({ visible: true, title, message });
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      showErrorModal('Email Kosong', 'Silakan masukkan alamat email.');
      return;
    }

    if (!password) {
      showErrorModal('Password Kosong', 'Silakan masukkan password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch (error: any) {
      showErrorModal(
        error?.title || 'Login Gagal',
        error?.message || 'Terjadi kesalahan saat login.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordReset = async (resetEmail: string) => {
    try {
      await sendPasswordReset(resetEmail);
      setSuccessMessage('Link reset password telah dikirim ke email Anda.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      showErrorModal('Reset Password Gagal', error.message);
      throw error;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/iconmain.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>
            Silakan masuk untuk melanjutkan transaksi kasir.
          </Text>

          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

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

          <TouchableOpacity
            onPress={() => setResetPasswordModal(true)}
            disabled={isLoading}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Akun dibuat oleh administrator sistem.
          </Text>

          {!isKeyboardVisible && (
            <Text style={styles.footerText}>
              Swiftstock by Efendi • © 2025
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, visible: false })}
      />

      <ResetPasswordModal
        visible={resetPasswordModal}
        onClose={() => setResetPasswordModal(false)}
        onSendReset={handleSendPasswordReset}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardBg,
    borderRadius: 25,
    padding: 25,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'PoppinsSemiBold',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 25,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginVertical: 8,
  },
  forgotPasswordText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
  },
  loginButton: {
    backgroundColor: COLORS.secondary,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
  },
  infoText: {
    marginTop: 20,
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
  },
  footerText: {
    marginTop: 30,
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    fontFamily: 'PoppinsRegular',
  },
});

export default LoginScreen;
