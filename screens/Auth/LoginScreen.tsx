import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { loginUser } from '../../services/authService';
import FloatingLabelInput from '../../components/FloatingLabelInput';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const { height } = Dimensions.get('window');

// --- KONSTANTA WARNA DARI LOGO ---
const COLORS = {
  primary: '#1C3A5A',      // Biru Tua (Dark Navy Blue)
  secondary: '#00A79D',    // Hijau Tosca/Sian (Teal/Cyan)
  accent: '#F58220',       // Oranye Terang (Bright Orange)
  background: '#F5F5F5',   // Abu-abu Sangat Terang
  cardBg: '#FFFFFF',       // Putih untuk card
  textDark: '#444444',     // Abu-abu Gelap
  textLight: '#7f8c8d',    // Abu-abu Terang
  disabled: '#95a5a6',     // Abu-abu untuk disabled
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const navigation = useNavigation<LoginNavigationProp>();

  // --- Hooks Animasi ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animasi Pintu Masuk
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
    
    // Listener untuk Keyboard (untuk menyesuaikan tampilan saat keyboard muncul)
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fadeAnim, scaleAnim]);

  // --- Fungsi Login ---
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan Password harus diisi.', [{ text: 'OK' }]);
      return;
    }

    setIsLoading(true);

    try {
      const { user, role } = await loginUser(email, password);
      console.log(`Pengguna ${user.uid} login dengan role: ${role}`);

      if (role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('CashierDashboard');
      }
    } catch (error: any) {
      Alert.alert(
        'Login Gagal',
        error.code === 'auth/invalid-credential'
          ? 'Email atau Password salah. Silakan periksa kembali.'
          : 'Terjadi kesalahan jaringan atau server. Silakan coba lagi.',
      );
      console.error('Login Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Komponen Tombol Kustom dengan Animasi Sentuhan (Press Animation) ---
  const AnimatedLoginButton = ({ title, onPress, disabled }: any) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.timing(pressAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
      Animated.timing(pressAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[styles.loginButtonContainer, disabled && styles.loginButtonDisabled]}
      >
        <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
          {disabled ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>{title}</Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* Container utama untuk Login Card */}
      <Animated.View style={[
          styles.card, 
          { 
              opacity: fadeAnim, 
              // Geser card ke atas saat keyboard muncul
              transform: [
                { scale: scaleAnim },
                { translateY: isKeyboardVisible ? (Platform.OS === 'ios' ? -height * 0.1 : -height * 0.05) : 0 },
              ]
          }
      ]}>
          {/* Logo Image */}
          <Image 
            source={require('../../assets/login.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={styles.subtitle}>Masukkan Akun Anda</Text>

          {/* Input Email menggunakan FloatingLabelInput */}
          <FloatingLabelInput
            label="Email Kasir/Admin"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Input Password menggunakan FloatingLabelInput */}
          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Tombol Login */}
          <AnimatedLoginButton
            title="Masuk"
            onPress={handleLogin}
            disabled={isLoading}
          />

          {/* Link Pendaftaran */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
          >
            <Text style={styles.registerText}>
              Belum punya akun? <Text style={styles.registerTextHighlight}>Daftar di sini</Text>
            </Text>
          </TouchableOpacity>
      </Animated.View>
      
      {/* Teks Footer */}
      {!isKeyboardVisible && (
        <Animated.Text 
            style={[styles.footerText, { opacity: fadeAnim }]}
        >
            Aplikasi Point of Sale | © 2025
        </Animated.Text>
      )}

    </View>
  );
};

// --- STYLING DENGAN SKEMA WARNA LOGO ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background, // #F5F5F5 - Abu-abu Sangat Terang
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardBg, // #FFFFFF
    borderRadius: 20,
    padding: 30,
    // Bayangan elegan dengan warna primary
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textDark, // #444444 - Abu-abu Gelap
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  // --- Styling Tombol Login dengan Gradient Effect ---
  loginButtonContainer: {
    backgroundColor: COLORS.secondary, // #00A79D - Hijau Tosca
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    // Bayangan untuk depth
    ...Platform.select({
      ios: {
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.disabled, // #95a5a6
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  // --- Styling Link Pendaftaran ---
  registerLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.textLight, // #7f8c8d
    fontSize: 15,
  },
  registerTextHighlight: {
    color: COLORS.primary, // #1C3A5A - Biru Tua
    fontWeight: '700',
  },
  footerText: {
    marginTop: 40,
    fontSize: 12,
    color: COLORS.textLight, // #7f8c8d
    position: 'absolute',
    bottom: 20,
  }
});

export default LoginScreen;