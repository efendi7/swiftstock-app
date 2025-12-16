import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';

/**
 * Mendapatkan role pengguna dari ID Token (diasumsikan sudah diatur di Firebase Cloud Functions)
 */
const getUserRole = async (user: User): Promise<string> => {
    try {
        const idTokenResult = await user.getIdTokenResult(true);
        // Default role adalah 'kasir' jika tidak ada claim 'role'
        return idTokenResult.claims.role as string || 'kasir'; 
    } catch (e) {
        console.error("Gagal mendapatkan role:", e);
        return 'kasir';
    }
};

/**
 * Fungsi Login
 */
export const loginUser = async (email: string, password: string): Promise<{ user: User, role: string }> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const role = await getUserRole(user);
    return { user, role };
};

// Register baru (default role: kasir)
export const registerUser = async (email: string, password: string): Promise<void> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Role 'kasir' akan otomatis karena belum ada custom claim
  // Jika ingin set role admin, harus pakai Firebase Admin SDK di backend
  console.log('User baru dibuat:', userCredential.user.uid);
};