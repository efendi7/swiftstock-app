import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface CreateCashierData {
  name: string;
  email: string;
  password: string;
  tenantId: string;
  storeName: string;
}

export const createCashierAccount = onCall(async (request) => {
  // 1. Validasi auth
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus login terlebih dahulu.');
  }

  // 2. Validasi role admin
  const callerDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang dapat membuat akun kasir.');
  }

  const { name, email, password, tenantId, storeName }: CreateCashierData = request.data;

  if (!name || !email || !password || !tenantId) {
    throw new HttpsError('invalid-argument', 'Mohon lengkapi semua data.');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email.trim().toLowerCase(),
      password: password,
      displayName: name.trim(),
    });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'cashier',
      status: 'active',
      tenantId: tenantId,
      storeName: storeName || '',
      phoneNumber: null,
      photoURL: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };

  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email sudah terdaftar.');
    }
    throw new HttpsError('internal', error.message);
  }
});