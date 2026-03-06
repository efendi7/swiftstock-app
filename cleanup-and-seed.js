/**
 * cleanup-and-seed.js
 *
 * Yang dilakukan:
 * 1. Hapus root collections legacy (products, transactions, dll)
 * 2. Hapus users KECUALI CXGKoCjaFtXIcAtJvh2CrnqplY22
 * 3. Hapus tenants KECUALI igoEJ8UF9njGtNOTSzXx
 * 4. Hapus subcollections di dalam tenant
 * 5. Seed categories
 * 6. Seed products + stock_purchases
 * 7. Seed activities
 * 8. Update metadata
 *
 * Cara pakai:
 * 1. Taruh file ini + serviceAccountKey.json di folder yang sama
 * 2. npm install firebase-admin
 * 3. node cleanup-and-seed.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db        = admin.firestore();
const TENANT_ID = 'igoEJ8UF9njGtNOTSzXx';
const KEEP_USER = 'CXGKoCjaFtXIcAtJvh2CrnqplY22';

// Helper: hapus semua dokumen dalam collection (batch 400)
async function deleteCollection(colRef, label) {
  const snap = await colRef.get();
  if (snap.empty) {
    console.log('  skip: ' + label + ' kosong.');
    return 0;
  }
  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const chunk = snap.docs.slice(i, i + 400);
    const batch = db.batch();
    chunk.forEach(function(d) { batch.delete(d.ref); });
    await batch.commit();
    deleted += chunk.length;
  }
  console.log('  hapus ' + label + ': ' + deleted + ' dokumen.');
  return deleted;
}

// STEP 1: Hapus root legacy collections
async function cleanupRootCollections() {
  console.log('\n[STEP 1] Cleanup root legacy collections');
  var list = ['products','transactions','activities','stock_purchases','categories','counters'];
  for (var i = 0; i < list.length; i++) {
    await deleteCollection(db.collection(list[i]), 'root/' + list[i]);
  }
  console.log('  done.');
}

// STEP 2: Hapus users kecuali KEEP_USER
async function cleanupUsers() {
  console.log('\n[STEP 2] Cleanup users (simpan ' + KEEP_USER + ')');
  var snap = await db.collection('users').get();
  var toDelete = snap.docs.filter(function(d) { return d.id !== KEEP_USER; });
  if (toDelete.length === 0) {
    console.log('  tidak ada user lain, skip.');
    return;
  }
  var batch = db.batch();
  toDelete.forEach(function(d) { batch.delete(d.ref); });
  await batch.commit();
  console.log('  hapus ' + toDelete.length + ' user, ' + KEEP_USER + ' aman.');
}

// STEP 3: Hapus tenants kecuali TENANT_ID
async function cleanupTenants() {
  console.log('\n[STEP 3] Cleanup tenants (simpan ' + TENANT_ID + ')');
  var snap = await db.collection('tenants').get();
  var toDelete = snap.docs.filter(function(d) { return d.id !== TENANT_ID; });
  if (toDelete.length === 0) {
    console.log('  tidak ada tenant lain, skip.');
    return;
  }
  var batch = db.batch();
  toDelete.forEach(function(d) { batch.delete(d.ref); });
  await batch.commit();
  console.log('  hapus ' + toDelete.length + ' tenant, ' + TENANT_ID + ' aman.');
}

// STEP 4: Hapus subcollections di dalam tenant
async function cleanupTenantCollections() {
  console.log('\n[STEP 4] Cleanup subcollections tenant');
  var subs = ['products','categories','activities','transactions','stock_purchases','metadata'];
  var tenantRef = db.collection('tenants').doc(TENANT_ID);
  for (var i = 0; i < subs.length; i++) {
    await deleteCollection(tenantRef.collection(subs[i]), 'tenants/' + TENANT_ID + '/' + subs[i]);
  }
  console.log('  done.');
}

// STEP 5: Verifikasi user masih ada
async function verifyUser() {
  console.log('\n[STEP 5] Verifikasi user');
  var userDoc = await db.collection('users').doc(KEEP_USER).get();
  if (userDoc.exists) {
    var d = userDoc.data();
    console.log('  user aman: ' + (d.email || d.displayName || KEEP_USER));
  } else {
    console.log('  catatan: user tidak ada di Firestore (mungkin hanya di Auth, itu normal).');
  }
}

// DATA
var CATEGORIES = [
  'Makanan','Minuman','Snack','Rokok','Sembako',
  'Kebersihan','Kesehatan','Elektronik','Aksesoris HP','Alat Tulis',
];

var PRODUCTS = [
  { name:'Indomie Goreng',          category:'Makanan',     price:3500,  purchasePrice:2800,  stock:120, supplier:'Indofood',        barcode:'8991101020149' },
  { name:'Indomie Soto',            category:'Makanan',     price:3500,  purchasePrice:2800,  stock:95,  supplier:'Indofood',        barcode:'8991101020156' },
  { name:'Mie Sedaap Goreng',       category:'Makanan',     price:3200,  purchasePrice:2500,  stock:80,  supplier:'Wings Food',      barcode:'8992388010013' },
  { name:'Biscuit Oreo Original',   category:'Makanan',     price:8500,  purchasePrice:6800,  stock:60,  supplier:'Nabisco',         barcode:'7622201376214' },
  { name:'Roti Tawar Sari Roti',    category:'Makanan',     price:16000, purchasePrice:13000, stock:30,  supplier:'Nippon Indosari', barcode:'8996001300017' },
  { name:'Wafer Tango Coklat',      category:'Makanan',     price:5000,  purchasePrice:3800,  stock:75,  supplier:'Orang Tua',       barcode:'8994689900016' },
  { name:'Kacang Garuda Asin',      category:'Makanan',     price:7000,  purchasePrice:5500,  stock:50,  supplier:'Garuda Food',     barcode:'8996001101109' },
  { name:'Mie Cup Sedaap',          category:'Makanan',     price:6500,  purchasePrice:5000,  stock:40,  supplier:'Wings Food',      barcode:'8992388020012' },
  { name:'Aqua 600ml',              category:'Minuman',     price:4000,  purchasePrice:2800,  stock:200, supplier:'Danone',          barcode:'8999999007506' },
  { name:'Aqua 1500ml',             category:'Minuman',     price:7000,  purchasePrice:5200,  stock:144, supplier:'Danone',          barcode:'8999999007520' },
  { name:'Teh Botol Sosro 450ml',   category:'Minuman',     price:5000,  purchasePrice:3800,  stock:96,  supplier:'Sosro',           barcode:'8993388006072' },
  { name:'Pocari Sweat 500ml',      category:'Minuman',     price:8000,  purchasePrice:6200,  stock:48,  supplier:'Otsuka',          barcode:'4987035540571' },
  { name:'Coca Cola 390ml',         category:'Minuman',     price:6000,  purchasePrice:4500,  stock:72,  supplier:'Coca Cola',       barcode:'5449000000996' },
  { name:'Good Day Cappuccino',     category:'Minuman',     price:3000,  purchasePrice:2200,  stock:100, supplier:'Santos Jaya',     barcode:'8992753002015' },
  { name:'Susu Ultra Milk 250ml',   category:'Minuman',     price:5500,  purchasePrice:4200,  stock:60,  supplier:'Ultra Jaya',      barcode:'8997073000128' },
  { name:'Le Minerale 600ml',       category:'Minuman',     price:4000,  purchasePrice:2900,  stock:168, supplier:'Mayora',          barcode:'8994375000029' },
  { name:'Chitato Sapi Panggang',   category:'Snack',       price:10000, purchasePrice:7800,  stock:55,  supplier:'Indofood',        barcode:'8991101461218' },
  { name:'Lays Original 68g',       category:'Snack',       price:10000, purchasePrice:7800,  stock:45,  supplier:'Indofood',        barcode:'8991101461300' },
  { name:'Cheetos 65g',             category:'Snack',       price:9500,  purchasePrice:7200,  stock:50,  supplier:'Indofood',        barcode:'8991101461416' },
  { name:'Qtela Singkong 60g',      category:'Snack',       price:8000,  purchasePrice:6000,  stock:40,  supplier:'Garuda Food',     barcode:'8996001520019' },
  { name:'Piattos Keju 68g',        category:'Snack',       price:10000, purchasePrice:7800,  stock:35,  supplier:'Indofood',        barcode:'8991101461515' },
  { name:'Sampoerna Mild 16',       category:'Rokok',       price:28000, purchasePrice:25500, stock:50,  supplier:'Sampoerna',       barcode:'8993572000016' },
  { name:'Gudang Garam Surya 16',   category:'Rokok',       price:27000, purchasePrice:24500, stock:50,  supplier:'Gudang Garam',    barcode:'8999999550016' },
  { name:'Marlboro Red 20',         category:'Rokok',       price:38000, purchasePrice:35000, stock:30,  supplier:'Philip Morris',   barcode:'5012345678900' },
  { name:'Djarum Super 16',         category:'Rokok',       price:25000, purchasePrice:22500, stock:40,  supplier:'Djarum',          barcode:'8993460000016' },
  { name:'LA Bold 16',              category:'Rokok',       price:26000, purchasePrice:23500, stock:35,  supplier:'Bentoel',         barcode:'8993460100016' },
  { name:'Beras Premium 5kg',       category:'Sembako',     price:75000, purchasePrice:65000, stock:20,  supplier:'Tani Maju',       barcode:'8992700050013' },
  { name:'Gula Pasir 1kg',          category:'Sembako',     price:16000, purchasePrice:13500, stock:30,  supplier:'Gulaku',          barcode:'8993700010010' },
  { name:'Minyak Goreng Bimoli 1L', category:'Sembako',     price:20000, purchasePrice:17000, stock:25,  supplier:'Bimoli',          barcode:'8996001900010' },
  { name:'Tepung Terigu Segitiga',  category:'Sembako',     price:13000, purchasePrice:10500, stock:20,  supplier:'Bogasari',        barcode:'8991201001007' },
  { name:'Telur Ayam 1kg',          category:'Sembako',     price:28000, purchasePrice:24000, stock:15,  supplier:'Peternak Lokal',  barcode:'8990000000001' },
  { name:'Sabun Lifebuoy 80g',      category:'Kebersihan',  price:5000,  purchasePrice:3800,  stock:60,  supplier:'Unilever',        barcode:'8851932041208' },
  { name:'Shampo Pantene 70ml',     category:'Kebersihan',  price:9000,  purchasePrice:7000,  stock:45,  supplier:'P&G',             barcode:'8001841618296' },
  { name:'Pasta Gigi Pepsodent 75g',category:'Kebersihan',  price:8000,  purchasePrice:6200,  stock:50,  supplier:'Unilever',        barcode:'8851932010204' },
  { name:'Deterjen Rinso 800g',     category:'Kebersihan',  price:25000, purchasePrice:20000, stock:30,  supplier:'Unilever',        barcode:'8851932060223' },
  { name:'Sunlight 755ml',          category:'Kebersihan',  price:18000, purchasePrice:14500, stock:35,  supplier:'Unilever',        barcode:'8851932030202' },
  { name:'Paracetamol 500mg',       category:'Kesehatan',   price:5000,  purchasePrice:3500,  stock:40,  supplier:'Kimia Farma',     barcode:'8996001700001' },
  { name:'Antangin JRG Sachet',     category:'Kesehatan',   price:3500,  purchasePrice:2500,  stock:60,  supplier:'Deltomed',        barcode:'8997009000014' },
  { name:'Tolak Angin Sachet',      category:'Kesehatan',   price:4000,  purchasePrice:3000,  stock:50,  supplier:'Sido Muncul',     barcode:'8993663000015' },
  { name:'Betadine 30ml',           category:'Kesehatan',   price:18000, purchasePrice:14000, stock:20,  supplier:'Mundipharma',     barcode:'8992634000017' },
  { name:'Masker Medis 50pcs',      category:'Kesehatan',   price:35000, purchasePrice:28000, stock:25,  supplier:'OneMed',          barcode:'8997700500015' },
  { name:'Baterai ABC AA 2pcs',     category:'Elektronik',  price:8000,  purchasePrice:6000,  stock:40,  supplier:'ABC',             barcode:'8992699000020' },
  { name:'Baterai ABC AAA 2pcs',    category:'Elektronik',  price:7500,  purchasePrice:5500,  stock:35,  supplier:'ABC',             barcode:'8992699000037' },
  { name:'Lampu LED 5W Philips',    category:'Elektronik',  price:25000, purchasePrice:19000, stock:20,  supplier:'Philips',         barcode:'8711500926692' },
  { name:'Kabel Data USB-C 1m',     category:'Aksesoris HP',price:25000, purchasePrice:15000, stock:15,  supplier:'Anker',           barcode:'8996100000021' },
  { name:'Earphone Basic 3.5mm',    category:'Aksesoris HP',price:20000, purchasePrice:12000, stock:10,  supplier:'JBL KW',          barcode:'8996100000038' },
  { name:'Charger 10W Universal',   category:'Aksesoris HP',price:35000, purchasePrice:22000, stock:8,   supplier:'Anker',           barcode:'8996100000045' },
  { name:'Pulpen Pilot G-1 Hitam',  category:'Alat Tulis',  price:8000,  purchasePrice:5500,  stock:30,  supplier:'Pilot',           barcode:'4902505163654' },
  { name:'Buku Tulis Sidu 58lbr',   category:'Alat Tulis',  price:5000,  purchasePrice:3500,  stock:50,  supplier:'Sidu',            barcode:'8992700580013' },
  { name:'Pensil 2B Faber Castell', category:'Alat Tulis',  price:3500,  purchasePrice:2500,  stock:40,  supplier:'Faber Castell',   barcode:'4005401176121' },
];

// STEP 6: Seed categories
async function seedCategories() {
  console.log('\n[STEP 6] Seed categories');
  var col = db.collection('tenants/' + TENANT_ID + '/categories');
  var now = admin.firestore.FieldValue.serverTimestamp();
  for (var i = 0; i < CATEGORIES.length; i++) {
    await col.add({ name: CATEGORIES[i], createdAt: now });
    console.log('  + ' + CATEGORIES[i]);
  }
  console.log('  done: ' + CATEGORIES.length + ' categories.');
}

// STEP 7: Seed products + stock_purchases
async function seedProducts() {
  console.log('\n[STEP 7] Seed products');
  var productCol  = db.collection('tenants/' + TENANT_ID + '/products');
  var purchaseCol = db.collection('tenants/' + TENANT_ID + '/stock_purchases');
  var now         = admin.firestore.FieldValue.serverTimestamp();
  var soldVariants = [0,5,12,23,45,78,102,200,350,500];

  for (var i = 0; i < PRODUCTS.length; i++) {
    var p        = PRODUCTS[i];
    var soldCount = soldVariants[i % soldVariants.length];
    var productRef = productCol.doc();

    await productRef.set({
      name:          p.name,
      category:      p.category,
      price:         p.price,
      purchasePrice: p.purchasePrice,
      stock:         p.stock,
      soldCount:     soldCount,
      supplier:      p.supplier,
      barcode:       p.barcode,
      barcodeType:   'EAN13',
      imageUrl:      '',
      createdAt:     now,
      updatedAt:     now,
    });

    await purchaseCol.add({
      productId:     productRef.id,
      productName:   p.name,
      quantity:      p.stock,
      purchasePrice: p.purchasePrice,
      totalCost:     p.stock * p.purchasePrice,
      isNewProduct:  true,
      addedBy:       'seed-script',
      date:          now,
      createdAt:     now,
    });

    console.log('  [' + (i+1) + '/' + PRODUCTS.length + '] ' + p.name);
  }
  console.log('  done: ' + PRODUCTS.length + ' products + stock_purchases.');
}

// STEP 8: Seed activities
async function seedActivities() {
  console.log('\n[STEP 8] Seed activities');
  var col = db.collection('tenants/' + TENANT_ID + '/activities');
  var now = Date.now();
  var mnt = 60 * 1000;
  var hr  = 60 * mnt;
  var day = 24 * hr;

  var activities = [
    { type:'TAMBAH', message:'Produk baru "Indomie Goreng" stok: 120',         userName:'Efendi', userId:KEEP_USER, offset:2*mnt },
    { type:'TAMBAH', message:'Produk baru "Aqua 600ml" stok: 200',             userName:'Efendi', userId:KEEP_USER, offset:15*mnt },
    { type:'TAMBAH', message:'Produk baru "Sampoerna Mild 16" stok: 50',       userName:'Efendi', userId:KEEP_USER, offset:40*mnt },
    { type:'TAMBAH', message:'Produk baru "Chitato Sapi Panggang" stok: 55',   userName:'Efendi', userId:KEEP_USER, offset:1*hr },
    { type:'TAMBAH', message:'Produk baru "Paracetamol 500mg" stok: 40',       userName:'Efendi', userId:KEEP_USER, offset:2*hr },
    { type:'IN',     message:'Stok "Aqua 600ml" masuk 50 unit',                userName:'Efendi', userId:KEEP_USER, offset:3*hr },
    { type:'IN',     message:'Stok "Indomie Goreng" masuk 100 unit',           userName:'Efendi', userId:KEEP_USER, offset:5*hr },
    { type:'IN',     message:'Stok "Beras Premium 5kg" masuk 20 unit',         userName:'Efendi', userId:KEEP_USER, offset:7*hr },
    { type:'IN',     message:'Stok "Gudang Garam Surya 16" masuk 30 unit',     userName:'Efendi', userId:KEEP_USER, offset:10*hr },
    { type:'IN',     message:'Stok "Deterjen Rinso 800g" masuk 25 unit',       userName:'Efendi', userId:KEEP_USER, offset:12*hr },
    { type:'KELUAR', message:'Penjualan TRX-2026-0001: 2 unit "Indomie Goreng" seharga Rp 3.500, 1 unit "Aqua 600ml" seharga Rp 4.000. Total Rp 11.000',         userName:'Efendi', userId:KEEP_USER, offset:1*day },
    { type:'KELUAR', message:'Penjualan TRX-2026-0002: 3 unit "Chitato Sapi Panggang" seharga Rp 10.000. Total Rp 30.000',                                        userName:'Efendi', userId:KEEP_USER, offset:1*day+2*hr },
    { type:'KELUAR', message:'Penjualan TRX-2026-0003: 1 unit "Sampoerna Mild 16" seharga Rp 28.000, 2 unit "Aqua 600ml" seharga Rp 4.000. Total Rp 36.000',     userName:'Efendi', userId:KEEP_USER, offset:1*day+4*hr },
    { type:'KELUAR', message:'Penjualan TRX-2026-0004: 5 unit "Indomie Goreng" seharga Rp 3.500. Total Rp 17.500',                                               userName:'Efendi', userId:KEEP_USER, offset:1*day+6*hr },
    { type:'KELUAR', message:'Penjualan TRX-2026-0005: 1 unit "Baterai ABC AA 2pcs" seharga Rp 8.000, 1 unit "Lampu LED 5W Philips" seharga Rp 25.000. Total Rp 33.000', userName:'Efendi', userId:KEEP_USER, offset:1*day+8*hr },
    { type:'OUT',    message:'Stok "Telur Ayam 1kg" keluar 5 unit',            userName:'Efendi', userId:KEEP_USER, offset:2*day },
    { type:'OUT',    message:'Stok "Masker Medis 50pcs" keluar 3 unit',        userName:'Efendi', userId:KEEP_USER, offset:2*day+3*hr },
    { type:'UPDATE', message:'Update "Aqua 600ml": harga: 3500 -> 4000',       userName:'Efendi', userId:KEEP_USER, offset:3*day },
    { type:'UPDATE', message:'Update "Marlboro Red 20": harga: 35000 -> 38000',userName:'Efendi', userId:KEEP_USER, offset:3*day+2*hr },
    { type:'UPDATE', message:'Update "Indomie Goreng": nama: Indomie Goreng -> Indomie Goreng Special', userName:'Efendi', userId:KEEP_USER, offset:4*day },
  ];

  for (var i = 0; i < activities.length; i++) {
    var act = activities[i];
    var ts  = admin.firestore.Timestamp.fromMillis(now - act.offset);
    await col.add({
      type:      act.type,
      message:   act.message,
      userName:  act.userName,
      userId:    act.userId,
      createdAt: ts,
    });
  }
  console.log('  done: ' + activities.length + ' activities.');
}

// STEP 9: Update metadata
async function updateMetadata() {
  console.log('\n[STEP 9] Update metadata');
  var metaRef = db.collection('tenants').doc(TENANT_ID)
    .collection('metadata').doc('dashboard');
  await metaRef.set({
    totalProducts: PRODUCTS.length,
    lastUpdated:   admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('  done.');
}

// MAIN
async function main() {
  console.log('== Cleanup & Seed ==');
  console.log('Tenant : ' + TENANT_ID);
  console.log('User   : ' + KEEP_USER + ' (tidak disentuh)');

  await cleanupRootCollections();
  await cleanupUsers();
  await cleanupTenants();
  await cleanupTenantCollections();
  await verifyUser();
  await seedCategories();
  await seedProducts();
  await seedActivities();
  await updateMetadata();

  console.log('\n== Selesai! Cek Firebase Console. ==');
  process.exit(0);
}

main().catch(function(err) {
  console.error('ERROR:', err);
  process.exit(1);
});