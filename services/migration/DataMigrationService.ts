/**
 * ==========================================
 * SCRIPT MIGRASI DATA LEGACY KE SAAS
 * ==========================================
 * 
 * File: src/services/migration/DataMigrationService.ts
 * 
 * Fungsi: Memindahkan data user lama dari root collection
 * ke tenant-specific subcollection
 * 
 * CARA PAKAI:
 * 1. Copy file ini ke: src/services/migration/DataMigrationService.ts
 * 2. Import di useAuth hook
 * 3. Migrasi akan berjalan otomatis saat user lama login
 */

import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface MigrationResult {
  migrated: number;
  skipped: number;
  error?: string;
}

interface MigrationLog {
  userId: string;
  tenantId: string;
  startTime: Date;
  endTime?: Date;
  results: {
    products?: MigrationResult;
    transactions?: MigrationResult;
    activities?: MigrationResult;
    categories?: MigrationResult;
    stockPurchases?: MigrationResult;
  };
}

export class DataMigrationService {
  /**
   * Migrate data dari root collection ke tenant-specific subcollection
   * @param userId - ID user yang akan dimigrasi
   * @param tenantId - ID tenant yang baru dibuat
   */
  static async migrateUserDataToTenant(userId: string, tenantId: string) {
    console.log(`🔄 [MIGRATION] Memulai migrasi data untuk user ${userId} ke tenant ${tenantId}...`);
    
    const migrationLog: MigrationLog = {
      userId,
      tenantId,
      startTime: new Date(),
      results: {}
    };

    try {
      // 1. Migrasi Products
      migrationLog.results.products = await this.migrateProducts(tenantId);
      
      // 2. Migrasi Transactions (filter by cashierId or userId)
      migrationLog.results.transactions = await this.migrateTransactions(userId, tenantId);
      
      // 3. Migrasi Activities
      migrationLog.results.activities = await this.migrateActivities(userId, tenantId);
      
      // 4. Migrasi Categories (jika ada)
      migrationLog.results.categories = await this.migrateCategories(tenantId);
      
      // 5. Migrasi Stock Purchases (jika ada)
      migrationLog.results.stockPurchases = await this.migrateStockPurchases(tenantId);
      
      migrationLog.endTime = new Date();
      const duration = migrationLog.endTime.getTime() - migrationLog.startTime.getTime();
      
      console.log('✅ [MIGRATION] Migrasi selesai dalam', duration, 'ms');
      console.log('📊 [MIGRATION] Hasil:', migrationLog.results);
      
      return { success: true, log: migrationLog };
    } catch (error) {
      console.error('❌ [MIGRATION] Error:', error);
      throw error;
    }
  }

  /**
   * Migrasi Products dari /products ke /tenants/{tenantId}/products
   */
  private static async migrateProducts(tenantId: string): Promise<MigrationResult> {
    try {
      const oldProductsRef = collection(db, 'products');
      const snapshot = await getDocs(oldProductsRef);
      
      if (snapshot.empty) {
        console.log('⚠️ [PRODUCTS] Tidak ada produk untuk dimigrasi');
        return { migrated: 0, skipped: 0 };
      }

      const batch = writeBatch(db);
      let count = 0;
      let batchCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const newRef = doc(db, 'tenants', tenantId, 'products', docSnap.id);
        
        batch.set(newRef, {
          ...data,
          migratedAt: Timestamp.now(),
          migratedFrom: 'legacy-root-collection'
        });
        
        count++;
        batchCount++;

        // Firestore batch limit adalah 500 operasi
        // Commit setiap 400 untuk aman
        if (batchCount >= 400) {
          await batch.commit();
          console.log(`📦 [PRODUCTS] Committed batch (${count} total so far)`);
          batchCount = 0;
        }
      }

      // Commit sisa batch
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`✅ [PRODUCTS] ${count} produk berhasil dimigrasi`);
      return { migrated: count, skipped: 0 };
    } catch (error) {
      console.error('❌ [PRODUCTS] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { migrated: 0, skipped: 0, error: errorMessage };
    }
  }

  /**
   * Migrasi Transactions dari /transactions ke /tenants/{tenantId}/transactions
   */
  private static async migrateTransactions(userId: string, tenantId: string): Promise<MigrationResult> {
    try {
      const oldTransRef = collection(db, 'transactions');
      
      // Coba filter berdasarkan cashierId
      // Jika tidak ada field cashierId, ambil semua
      let snapshot;
      
      try {
        const q = query(oldTransRef, where('cashierId', '==', userId));
        snapshot = await getDocs(q);
      } catch (filterError) {
        // Jika query gagal (field tidak ada), ambil semua transaksi
        console.log('⚠️ [TRANSACTIONS] Field cashierId tidak ada, migrasi semua transaksi');
        snapshot = await getDocs(oldTransRef);
      }
      
      if (snapshot.empty) {
        console.log('⚠️ [TRANSACTIONS] Tidak ada transaksi untuk dimigrasi');
        return { migrated: 0, skipped: 0 };
      }

      const batch = writeBatch(db);
      let count = 0;
      let batchCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const newRef = doc(db, 'tenants', tenantId, 'transactions', docSnap.id);
        
        batch.set(newRef, {
          ...data,
          migratedAt: Timestamp.now(),
          migratedFrom: 'legacy-root-collection'
        });
        
        count++;
        batchCount++;

        if (batchCount >= 400) {
          await batch.commit();
          console.log(`📦 [TRANSACTIONS] Committed batch (${count} total so far)`);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`✅ [TRANSACTIONS] ${count} transaksi berhasil dimigrasi`);
      return { migrated: count, skipped: 0 };
    } catch (error) {
      console.error('❌ [TRANSACTIONS] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { migrated: 0, skipped: 0, error: errorMessage };
    }
  }

  /**
   * Migrasi Activities dari /activities ke /tenants/{tenantId}/activities
   */
  private static async migrateActivities(userId: string, tenantId: string): Promise<MigrationResult> {
    try {
      const oldActRef = collection(db, 'activities');
      
      // Coba filter by userId, jika gagal ambil semua
      let snapshot;
      
      try {
        const q = query(oldActRef, where('userId', '==', userId));
        snapshot = await getDocs(q);
      } catch (filterError) {
        console.log('⚠️ [ACTIVITIES] Field userId tidak ada, migrasi semua aktivitas');
        snapshot = await getDocs(oldActRef);
      }
      
      if (snapshot.empty) {
        console.log('⚠️ [ACTIVITIES] Tidak ada aktivitas untuk dimigrasi');
        return { migrated: 0, skipped: 0 };
      }

      const batch = writeBatch(db);
      let count = 0;
      let batchCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const newRef = doc(db, 'tenants', tenantId, 'activities', docSnap.id);
        
        batch.set(newRef, {
          ...data,
          migratedAt: Timestamp.now(),
          migratedFrom: 'legacy-root-collection'
        });
        
        count++;
        batchCount++;

        if (batchCount >= 400) {
          await batch.commit();
          console.log(`📦 [ACTIVITIES] Committed batch (${count} total so far)`);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`✅ [ACTIVITIES] ${count} aktivitas berhasil dimigrasi`);
      return { migrated: count, skipped: 0 };
    } catch (error) {
      console.error('❌ [ACTIVITIES] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { migrated: 0, skipped: 0, error: errorMessage };
    }
  }

  /**
   * Migrasi Categories dari /categories ke /tenants/{tenantId}/categories
   */
  private static async migrateCategories(tenantId: string): Promise<MigrationResult> {
    try {
      const oldCatRef = collection(db, 'categories');
      const snapshot = await getDocs(oldCatRef);
      
      if (snapshot.empty) {
        console.log('⚠️ [CATEGORIES] Tidak ada kategori untuk dimigrasi');
        return { migrated: 0, skipped: 0 };
      }

      const batch = writeBatch(db);
      let count = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const newRef = doc(db, 'tenants', tenantId, 'categories', docSnap.id);
        
        batch.set(newRef, {
          ...data,
          migratedAt: Timestamp.now(),
          migratedFrom: 'legacy-root-collection'
        });
        
        count++;
      });

      await batch.commit();
      console.log(`✅ [CATEGORIES] ${count} kategori berhasil dimigrasi`);
      return { migrated: count, skipped: 0 };
    } catch (error) {
      console.error('❌ [CATEGORIES] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { migrated: 0, skipped: 0, error: errorMessage };
    }
  }

  /**
   * Migrasi Stock Purchases dari /stock_purchases ke /tenants/{tenantId}/stock_purchases
   */
  private static async migrateStockPurchases(tenantId: string): Promise<MigrationResult> {
    try {
      const oldStockRef = collection(db, 'stock_purchases');
      const snapshot = await getDocs(oldStockRef);
      
      if (snapshot.empty) {
        console.log('⚠️ [STOCK_PURCHASES] Tidak ada data untuk dimigrasi');
        return { migrated: 0, skipped: 0 };
      }

      const batch = writeBatch(db);
      let count = 0;
      let batchCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const newRef = doc(db, 'tenants', tenantId, 'stock_purchases', docSnap.id);
        
        batch.set(newRef, {
          ...data,
          migratedAt: Timestamp.now(),
          migratedFrom: 'legacy-root-collection'
        });
        
        count++;
        batchCount++;

        if (batchCount >= 400) {
          await batch.commit();
          console.log(`📦 [STOCK_PURCHASES] Committed batch (${count} total so far)`);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`✅ [STOCK_PURCHASES] ${count} stock purchases berhasil dimigrasi`);
      return { migrated: count, skipped: 0 };
    } catch (error) {
      console.error('❌ [STOCK_PURCHASES] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { migrated: 0, skipped: 0, error: errorMessage };
    }
  }

  /**
   * Helper: Cek apakah user sudah pernah dimigrasi
   */
  static async checkMigrationStatus(userId: string): Promise<{
    needsMigration: boolean;
    tenantId?: string;
  }> {
    try {
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('uid', '==', userId))
      );
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        return {
          needsMigration: !userData.tenantId,
          tenantId: userData.tenantId
        };
      }
      
      return { needsMigration: true };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return { needsMigration: true };
    }
  }
}