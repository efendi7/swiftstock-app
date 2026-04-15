/**
 * firebaseConfig.ts
 * Solusi: hapus @firebase/auth override dari tsconfig,
 * pakai require() untuk semua auth agar TypeScript tidak komplen.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore }                    from 'firebase/firestore';
import { getStorage }                      from 'firebase/storage';
import { Platform }                        from 'react-native';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ...(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID && {
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }),
};

const isFirstInit = getApps().length === 0;
const app         = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// Pakai require() untuk bypass konflik type antara RN dan web
// (tsconfig path @firebase/auth → index.rn.d.ts menyebabkan browserLocalPersistence hilang)
const firebaseAuth = require('firebase/auth');

export const auth = isFirstInit
  ? firebaseAuth.initializeAuth(app, {
      persistence: Platform.OS === 'web'
        ? firebaseAuth.browserLocalPersistence
        : firebaseAuth.getReactNativePersistence(
            require('@react-native-async-storage/async-storage').default
          ),
    })
  : firebaseAuth.getAuth(app);

export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;