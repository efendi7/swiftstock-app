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
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';

import { Mail, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { loginUser } from '../../services/authService';
import FloatingLabelInput from '../../components/FloatingLabelInput';

// Tipe navigasi (Sesuaikan dengan setup project Anda)
type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const { height } = Dimensions.get('window');

const COLORS = {
  primary: '#1C3A5A',
  secondary: '#00A79D',
  accent: '#F58220',
  background: '#F5F5F5',
  cardBg: '#FFFFFF',
  textDark: '#444444',
  textLight: '#7f8c8d',
  disabled: '#95a5a6',
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const navigation = useNavigation<LoginNavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan Password harus diisi.');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(email.trim(), password);
      // Catatan: Navigasi biasanya dihandle otomatis oleh Auth State di App.js
    } catch (error) {
      Alert.alert('Login Gagal', 'Email atau Password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image
            source={require('../../assets/iconmain.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>
            Silakan masuk untuk melanjutkan transaksi kasir Anda.
          </Text>

          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={20} color={COLORS.textLight} />}
          />

          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            isPassword
            icon={<Lock size={20} color={COLORS.textLight} />}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Masuk Sekarang</Text>
            )}
          </TouchableOpacity>

          {/* Link ke Register */}
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

        {!isKeyboardVisible && (
          <Text style={styles.footerText}>
            Swiftstock by Efendi • © 2025
          </Text>
        )}
      </ScrollView>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardBg,
    borderRadius: 25,
    padding: 25,
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
  logo: {
    width: '100%',
    height: 60,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'MontserratBold', // Diselaraskan dengan Register
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'PoppinsRegular', // Diselaraskan dengan Register
  },
  loginButton: {
    backgroundColor: COLORS.secondary,
    height: 55,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold', // Diselaraskan dengan Register
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
  },
  registerTextHighlight: {
    color: COLORS.primary,
    fontFamily: 'PoppinsSemiBold',
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