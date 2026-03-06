import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Platform, Image, ScrollView, KeyboardAvoidingView, Dimensions, ActivityIndicator
} from 'react-native';
import { Mail, Lock, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// FIREBASE IMPORTS
import { auth, db } from '@services/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import FloatingLabelInput from '@components/FloatingLabelInput';

const COLORS = {
  primary: '#1C3A5A',
  primaryDark: '#152D47',
  secondary: '#00A79D',
  accent: '#F58220',
  background: '#F5F5F5',
  cardBg: '#FFFFFF',
  textDark: '#444444',
  textLight: '#7f8c8d',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#ef4444',
  white: '#FFFFFF',
  border: '#E2E8F0',
} as const;

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const LOGIN_IMAGE = require('@assets/promo-login.jpg');
const REGISTER_IMAGE = require('@assets/promo-register.jpg');
const LOGO_IMAGE = require('@assets/iconmain.png');

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation Refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      alert("Harap lengkapi semua field.");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // === LOGIN ===
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // === REGISTER ===
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Generate Tenant ID untuk toko baru
        const tenantId = `tenant_${Date.now()}_${user.uid.substring(0, 8)}`;

        // 1. Buat Tenant Document (Toko)
        await setDoc(doc(db, 'tenants', tenantId), {
          name: `${fullName}'s Store`, // Bisa diganti nanti di settings
          adminId: user.uid,
          subscriptionPlan: 'free', // Trial gratis 30 hari
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 hari dari sekarang
          createdAt: new Date().toISOString(),
        });

        // 2. Buat User Document
        await setDoc(doc(db, 'users', user.uid), {
          fullName,
          email,
          role: 'admin', // Default role saat register = admin (pemilik toko)
          tenantId, // Link ke toko mereka
          createdAt: new Date().toISOString(),
          createdBy: user.uid, // Admin membuat akun sendiri
        });

        console.log('✅ Registration successful!');
        console.log('User UID:', user.uid);
        console.log('Tenant ID:', tenantId);
      }
    } catch (error: any) {
      console.error('❌ Auth Error:', error);
      
      // User-friendly error messages
      let errorMessage = error.message;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah terdaftar. Silakan login atau gunakan email lain.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password minimal 6 karakter.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password salah.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const animatedValues = useMemo(() => {
    const gridWidth = 500;
    return {
      formTranslateX: slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, gridWidth],
      }),
      promoTranslateX: slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -gridWidth],
      })
    };
  }, [slideAnim]);

  const toggleMode = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsLogin(prev => !prev);
    setTimeout(() => {
      setIsAnimating(false);
    }, 450);
  }, [isAnimating]);

  useEffect(() => {
    if (animationRef.current) animationRef.current.stop();

    const animation = Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isLogin ? 0 : 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]);

    animationRef.current = animation;
    animation.start();
  }, [isLogin, slideAnim, fadeAnim]);

  // --- UI FRAGMENT (Agar tidak duplikasi kode di Mobile & Desktop) ---
  const renderFields = () => (
    <>
      {!isLogin && (
        <FloatingLabelInput 
          label="Nama Lengkap" 
          value={fullName} 
          onChangeText={setFullName} 
          icon={<User size={20} color={COLORS.textLight} />} 
        />
      )}
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
        onPress={handleAuth}
        disabled={isLoading || isAnimating}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitButtonText}>
            {isLogin ? 'Masuk' : (isMobile ? 'Daftar' : 'Daftar Sekarang')}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  if (isMobile) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.mobileContent} keyboardShouldPersistTaps="handled">
          <View style={styles.mobileCard}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Image source={LOGO_IMAGE} style={styles.logoMobile} resizeMode="contain" />
              <Text style={styles.title}>{isLogin ? 'Masuk' : 'Daftar'}</Text>
              {renderFields()}
            </Animated.View>
            <TouchableOpacity onPress={toggleMode} style={styles.toggleButtonMobile} disabled={isAnimating}>
              <Text style={styles.toggleTextMobile}>
                {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <Text style={styles.toggleLink}>{isLogin ? 'Daftar' : 'Masuk'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.desktopBackground}>
      <View style={styles.mainWrapper}>
        <View style={styles.splitContainer}>
          
          <Animated.View style={[styles.formSection, { transform: [{ translateX: animatedValues.formTranslateX }] }]}>
            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formCard}>
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Image source={LOGO_IMAGE} style={styles.logo} resizeMode="contain" />
                  <Text style={styles.title}>{isLogin ? 'Selamat Datang' : 'Buat Akun'}</Text>
                  {renderFields()}
                </Animated.View>
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>{isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}</Text>
                  <TouchableOpacity onPress={toggleMode} disabled={isAnimating}>
                    <Text style={styles.toggleLink}>{isLogin ? 'Daftar' : 'Masuk'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          <Animated.View style={[styles.promoSection, { transform: [{ translateX: animatedValues.promoTranslateX }] }]}>
            <View style={styles.promoImageContainer}>
              <Image source={isLogin ? LOGIN_IMAGE : REGISTER_IMAGE} style={styles.promoImage} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(28, 58, 90, 0.7)', COLORS.primary]} locations={[0, 0.6, 1]} style={styles.promoOverlay}>
                <Animated.View style={[styles.promoContent, { opacity: fadeAnim }]}>
                  <Text style={styles.promoTitle}>{isLogin ? 'Kelola Toko\nLebih Efisien' : 'Mulai Bisnis\nDigital Anda'}</Text>
                  <Text style={styles.promoSubtitle}>Satu akun untuk semua kebutuhan kasir dan inventaris Anda.</Text>
                </Animated.View>
              </LinearGradient>
            </View>
          </Animated.View>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopBackground: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  mainWrapper: {
    width: '90%', maxWidth: 1000, height: '85%', maxHeight: 700, backgroundColor: COLORS.white, borderRadius: 30, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0px 20px 50px rgba(0,0,0,0.1)' }, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }, android: { elevation: 10 } }),
  },
  splitContainer: { flex: 1, flexDirection: 'row' },
  formSection: { width: '50%', backgroundColor: COLORS.white, zIndex: 2 },
  formContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  formCard: { width: '100%', maxWidth: 350 },
  promoSection: { width: '50%', zIndex: 1 },
  promoImageContainer: { flex: 1, position: 'relative' },
  promoImage: { width: '100%', height: '100%', position: 'absolute' },
  promoOverlay: { flex: 1, justifyContent: 'flex-end', padding: 40 },
  promoContent: { paddingBottom: 20 },
  logo: { width: 60, height: 60, alignSelf: 'center', marginBottom: 15 },
  logoMobile: { width: 50, height: 50, alignSelf: 'center', marginBottom: 15 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: COLORS.textDark },
  promoTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, textAlign: 'left', lineHeight: 40, marginBottom: 12 },
  promoSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.95)', textAlign: 'left', lineHeight: 24 },
  submitButton: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 25, minHeight: 55, justifyContent: 'center' },
  submitButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  toggleLink: { color: COLORS.primary, fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: COLORS.textLight, fontSize: 14 },
  container: { flex: 1, backgroundColor: COLORS.background },
  mobileContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  mobileCard: { backgroundColor: COLORS.white, padding: 25, borderRadius: 20, elevation: 4 },
  toggleButtonMobile: { marginTop: 20 },
  toggleTextMobile: { textAlign: 'center', color: COLORS.textLight, fontSize: 14 },
});

export default AuthScreen;