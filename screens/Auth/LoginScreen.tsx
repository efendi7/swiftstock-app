import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// FIREBASE
import { auth } from '@services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

import FloatingLabelInput from '@components/FloatingLabelInput';

const COLORS = {
  primary: '#1C3A5A',
  secondary: '#00A79D',
  background: '#F5F5F5',
  white: '#FFFFFF',
  textDark: '#444444',
  textLight: '#7f8c8d',
} as const;

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const LOGIN_IMAGE = require('@assets/promo-login.jpg');
const LOGO_IMAGE = require('@assets/iconmain.png');

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Harap lengkapi semua field.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation handled by AuthStateListener in AppNavigator
    } catch (error: any) {
      console.error('❌ Login Error:', error);

      let errorMessage = error.message;

      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password salah.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah.';
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const renderForm = () => (
    <>
      <FloatingLabelInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        icon={<Mail size={20} color={COLORS.textLight} />}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FloatingLabelInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        icon={<Lock size={20} color={COLORS.textLight} />}
      />

      <TouchableOpacity
        style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
        activeOpacity={0.8}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitButtonText}>Masuk</Text>
        )}
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity style={styles.forgotButton}>
        <Text style={styles.forgotText}>Lupa Password?</Text>
      </TouchableOpacity>
    </>
  );

  // ==================== MOBILE LAYOUT ====================
  if (isMobile) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.mobileContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mobileCard}>
            <Image source={LOGO_IMAGE} style={styles.logoMobile} resizeMode="contain" />
            <Text style={styles.title}>Selamat Datang</Text>
            <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

            {renderForm()}

            <TouchableOpacity onPress={goToRegister} style={styles.toggleButtonMobile}>
              <Text style={styles.toggleTextMobile}>
                Belum punya akun?{' '}
                <Text style={styles.toggleLink}>Daftar Sekarang</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ==================== DESKTOP LAYOUT ====================
  return (
    <View style={styles.desktopBackground}>
      <View style={styles.mainWrapper}>
        <View style={styles.splitContainer}>
          {/* LEFT SIDE - FORM */}
          <View style={styles.formSection}>
            <ScrollView
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formCard}>
                <Image source={LOGO_IMAGE} style={styles.logo} resizeMode="contain" />
                <Text style={styles.title}>Selamat Datang</Text>
                <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

                {renderForm()}

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Belum punya akun? </Text>
                  <TouchableOpacity onPress={goToRegister}>
                    <Text style={styles.toggleLink}>Daftar Sekarang</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* RIGHT SIDE - PROMO */}
          <View style={styles.promoSection}>
            <View style={styles.promoImageContainer}>
              <Image source={LOGIN_IMAGE} style={styles.promoImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(28, 58, 90, 0.7)', COLORS.primary]}
                locations={[0, 0.6, 1]}
                style={styles.promoOverlay}
              >
                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>Kelola Toko{'\n'}Lebih Efisien</Text>
                  <Text style={styles.promoSubtitle}>
                    Satu akun untuk semua kebutuhan kasir dan inventaris Anda.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ==================== COMMON ====================
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ==================== DESKTOP ====================
  desktopBackground: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainWrapper: {
    width: '90%',
    maxWidth: 1000,
    height: '85%',
    maxHeight: 700,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 20px 50px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  formSection: {
    width: '50%',
    backgroundColor: COLORS.white,
  },
  formContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  formCard: {
    width: '100%',
    maxWidth: 350,
  },
  promoSection: {
    width: '50%',
  },
  promoImageContainer: {
    flex: 1,
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  promoOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 40,
  },
  promoContent: {
    paddingBottom: 20,
  },
  promoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'left',
    lineHeight: 40,
    marginBottom: 12,
  },
  promoSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'left',
    lineHeight: 24,
  },

  // ==================== MOBILE ====================
  mobileContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  mobileCard: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // ==================== SHARED ELEMENTS ====================
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 15,
  },
  logoMobile: {
    width: 50,
    height: 50,
    alignSelf: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    color: COLORS.textLight,
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
    minHeight: 55,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 15,
    paddingVertical: 8,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  toggleLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  toggleButtonMobile: {
    marginTop: 20,
  },
  toggleTextMobile: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14,
  },
});

export default LoginScreen;