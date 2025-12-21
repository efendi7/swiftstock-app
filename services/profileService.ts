import { updateProfile, User } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

const CLOUD_NAME = 'dlkrdbabo'; 
const UPLOAD_PRESET = 'expo_products'; // Sesuaikan jika ada preset khusus profil

export interface UserProfileData {
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
}

export class ProfileService {
  /**
   * Upload Foto Profil ke Cloudinary
   */
  static async uploadAvatar(uri: string): Promise<string> {
    try {
      const formData = new FormData();
      const fileType = uri.split('.').pop();

      formData.append('file', {
        uri: uri,
        name: `avatar_${auth.currentUser?.uid}.${fileType}`,
        type: `image/${fileType}`,
      } as any);
      
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'avatars'); // Simpan di folder khusus avatar

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Upload gagal');

      // Optimasi gambar otomatis dari Cloudinary
      return result.secure_url.replace('/upload/', '/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/');
    } catch (error) {
      console.error("Cloudinary Profile Error:", error);
      throw new Error("Gagal mengunggah foto profil.");
    }
  }

  /**
   * Update Profil (Auth & Firestore)
   */
  static async updateFullProfile(user: User, data: UserProfileData): Promise<void> {
    try {
      // 1. Update Firebase Auth (agar displayName & photoURL terupdate global)
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL
      });

      // 2. Update/Sync ke Firestore 'users' collection (untuk pencatatan data tambahan)
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        phoneNumber: data.phoneNumber || null,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      console.error("Update Profile Error:", error);
      throw new Error("Gagal memperbarui profil.");
    }
  }

  /**
   * Ambil data profil tambahan dari Firestore
   */
  static async getUserData(uid: string) {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  }
}