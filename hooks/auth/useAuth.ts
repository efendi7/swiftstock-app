/**
 * ==========================================
 * UPDATED useAuth HOOK WITH AUTO MIGRATION
 * ==========================================
 * 
 * File: src/hooks/auth/useAuth.ts
 * 
 * PERUBAHAN:
 * 1. Import DataMigrationService
 * 2. Tambahkan auto-migration saat user lama login
 * 3. Tambahkan flag migrationInProgress
 * 4. Fix TypeScript errors untuk window.alert
 */

import { useState, useEffect } from 'react';
import { auth, db } from '../../services/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection 
} from 'firebase/firestore';
import { Alert, Platform } from 'react-native';

// ✅ IMPORT SERVICE MIGRASI
import { DataMigrationService } from '../../services/migration/DataMigrationService';

// Helper function untuk show alert yang compatible di web & mobile
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // Di web, gunakan window.alert dengan pengecekan
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
    } else {
      console.log(`[ALERT] ${title}: ${message}`);
    }
  } else {
    // Di mobile, gunakan React Native Alert
    Alert.alert(title, message);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrationInProgress, setMigrationInProgress] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setLoading(true);
      
      try {
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // --- LOGIKA MIGRASI OTOMATIS ---
            if (!userData.tenantId) {
              console.log("🔄 Migrasi Otomatis: Membuat Tenant Baru...");
              
              const newTenantRef = doc(collection(db, 'tenants'));
              const newId = newTenantRef.id;
              
              // 1. Buat dokumen tenant
              await setDoc(newTenantRef, {
                storeName: userData.displayName || userData.email?.split('@')[0] || "Toko Baru",
                ownerId: currentUser.uid,
                createdAt: serverTimestamp(),
                status: 'active',
                plan: 'free' // Default plan
              });
              
              // 2. Update field tenantId di dokumen user
              await updateDoc(userRef, {
                tenantId: newId,
                migrationStartedAt: serverTimestamp()
              });
              
              // ✅ 3. MIGRASI DATA LAMA (ASYNC - TIDAK BLOCKING)
              setMigrationInProgress(true);
              
              // Set user dulu biar bisa masuk app
              setTenantId(newId);
              setUser({ ...currentUser, ...userData, tenantId: newId });
              setLoading(false); // ✅ Stop loading dulu
              
              // Background migration
              console.log('🔄 Memulai migrasi data lama di background...');
              
              DataMigrationService.migrateUserDataToTenant(currentUser.uid, newId)
                .then(async (result) => {
                  console.log('✅ Migrasi data selesai!', result);
                  
                  // Update user doc dengan status migrasi selesai
                  await updateDoc(userRef, {
                    migrationCompletedAt: serverTimestamp(),
                    migrationResult: result.log.results
                  });
                  
                  setMigrationInProgress(false);
                  
                  // Tampilkan notifikasi sukses
                  showAlert(
                    'Migrasi Berhasil',
                    'Data lama Anda berhasil dipindahkan ke sistem baru!'
                  );
                })
                .catch(async (migrationError) => {
                  console.error('⚠️ Error saat migrasi data:', migrationError);
                  
                  // Simpan error untuk debugging
                  const errorMessage = migrationError instanceof Error 
                    ? migrationError.message 
                    : 'Unknown error';
                  
                  await updateDoc(userRef, {
                    migrationError: errorMessage,
                    migrationFailedAt: serverTimestamp()
                  });
                  
                  setMigrationInProgress(false);
                  
                  // Tampilkan peringatan
                  showAlert(
                    'Peringatan',
                    'Ada masalah saat memindahkan data lama. Silakan hubungi support.'
                  );
                });
              
              // Return early karena sudah set state di atas
              return;
            } else {
              // User sudah memiliki tenantId
              setTenantId(userData.tenantId);
              setUser({ ...currentUser, ...userData });
            }
          } else {
            // Jika user login tapi profil di Firestore belum ada sama sekali
            // (user baru dari social login)
            console.log('ℹ️ User baru terdeteksi, membuat profil...');
            
            // Buat profil user baru sekaligus dengan tenant
            const newTenantRef = doc(collection(db, 'tenants'));
            const newTenantId = newTenantRef.id;
            
            // 1. Buat profil user baru DULU supaya rule Firestore (isAdmin) lolos
            await setDoc(userRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: 'admin',
              tenantId: newTenantId,
              isSetupComplete: false,
              createdAt: serverTimestamp(),
              status: 'active'
            });

            // 2. Baru buat Tenant
            await setDoc(newTenantRef, {
              storeName: currentUser.displayName || currentUser.email?.split('@')[0] || "Toko Baru",
              ownerId: currentUser.uid,
              businessType: 'retail', // Fallback type sesuai Opsi 2 (Store Setup)
              createdAt: serverTimestamp(),
              status: 'active',
              plan: 'free'
            });
            
            setTenantId(newTenantId);
            setUser({ 
              ...currentUser, 
              role: 'admin', 
              tenantId: newTenantId 
            });
          }
        } else {
          setTenantId(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth Hook Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    tenantId, 
    loading,
    migrationInProgress // ✅ Expose migration status
  };
};