import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth'; 
import { getFunctions } from 'firebase/functions'; // ← Tambahkan ini

const firebaseConfig = {
  apiKey: "AIzaSyAfZ63azjsqeQ2ImPUhuZACgCB1NSdmoW4",
  authDomain: "posreactnativeapp.firebaseapp.com",
  projectId: "posreactnativeapp",
  storageBucket: "posreactnativeapp.firebasestorage.app",
  messagingSenderId: "15853364504",
  appId: "1:15853364504:web:5d51e256a481369a2eea6d",
  measurementId: "G-Y9TJRJ7YMS"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); 
export const functions = getFunctions(app); // ← Tambahkan ini
// Hapus getAnalytics — tidak diperlukan dan bisa error di React Native