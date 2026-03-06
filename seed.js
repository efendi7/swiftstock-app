/**
 * seed.js
 * 
 * Cara pakai:
 * 1. Taruh file ini dan serviceAccountKey.json di folder yang sama
 * 2. npm install firebase-admin
 * 3. node seed.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const TENANT_ID = 'igoEJ8UF9njGtNOTSzXx';

// ─────────────────────────────────────────────
// DATA CATEGORIES
// ─────────────────────────────────────────────
const categories = [
  'Makanan',
  'Minuman',
  'Snack',
  'Rokok',
  'Sembako',
  'Kebersihan',
  'Kesehatan',
  'Elektronik',
  'Aksesoris HP',
  'Alat Tulis',
];

// ─────────────────────────────────────────────
// DATA PRODUCTS (50 produk realistis)
// ─────────────────────────────────────────────
const products = [
  // MAKANAN
  { name: 'Indomie Goreng', category: 'Makanan', price: 3500, purchasePrice: 2800, stock: 120, supplier: 'Indofood', barcode: '8991101020149' },
  { name: 'Indomie Soto', category: 'Makanan', price: 3500, purchasePrice: 2800, stock: 95, supplier: 'Indofood', barcode: '8991101020156' },
  { name: 'Mie Sedaap Goreng', category: 'Makanan', price: 3200, purchasePrice: 2500, stock: 80, supplier: 'Wings Food', barcode: '8992388010013' },
  { name: 'Biscuit Oreo Original', category: 'Makanan', price: 8500, purchasePrice: 6800, stock: 60, supplier: 'Nabisco', barcode: '7622201376214' },
  { name: 'Roti Tawar Sari Roti', category: 'Makanan', price: 16000, purchasePrice: 13000, stock: 30, supplier: 'Nippon Indosari', barcode: '8996001300017' },
  { name: 'Wafer Tango Coklat', category: 'Makanan', price: 5000, purchasePrice: 3800, stock: 75, supplier: 'Orang Tua', barcode: '8994689900016' },
  { name: 'Kacang Garuda Asin', category: 'Makanan', price: 7000, purchasePrice: 5500, stock: 50, supplier: 'Garuda Food', barcode: '8996001101109' },
  { name: 'Mie Cup Sedaap', category: 'Makanan', price: 6500, purchasePrice: 5000, stock: 40, supplier: 'Wings Food', barcode: '8992388020012' },

  // MINUMAN
  { name: 'Aqua 600ml', category: 'Minuman', price: 4000, purchasePrice: 2800, stock: 200, supplier: 'Danone', barcode: '8999999007506' },
  { name: 'Aqua 1500ml', category: 'Minuman', price: 7000, purchasePrice: 5200, stock: 144, supplier: 'Danone', barcode: '8999999007520' },
  { name: 'Teh Botol Sosro 450ml', category: 'Minuman', price: 5000, purchasePrice: 3800, stock: 96, supplier: 'Sosro', barcode: '8993388006072' },
  { name: 'Pocari Sweat 500ml', category: 'Minuman', price: 8000, purchasePrice: 6200, stock: 48, supplier: 'Otsuka', barcode: '4987035540571' },
  { name: 'Coca Cola 390ml', category: 'Minuman', price: 6000, purchasePrice: 4500, stock: 72, supplier: 'Coca Cola', barcode: '5449000000996' },
  { name: 'Good Day Cappuccino', category: 'Minuman', price: 3000, purchasePrice: 2200, stock: 100, supplier: 'Santos Jaya', barcode: '8992753002015' },
  { name: 'Susu Ultra Milk 250ml', category: 'Minuman', price: 5500, purchasePrice: 4200, stock: 60, supplier: 'Ultra Jaya', barcode: '8997073000128' },
  { name: 'Le Minerale 600ml', category: 'Minuman', price: 4000, purchasePrice: 2900, stock: 168, supplier: 'Mayora', barcode: '8994375000029' },

  // SNACK
  { name: 'Chitato Sapi Panggang 68g', category: 'Snack', price: 10000, purchasePrice: 7800, stock: 55, supplier: 'Indofood', barcode: '8991101461218' },
  { name: 'Lays Original 68g', category: 'Snack', price: 10000, purchasePrice: 7800, stock: 45, supplier: 'Indofood', barcode: '8991101461300' },
  { name: 'Cheetos 65g', category: 'Snack', price: 9500, purchasePrice: 7200, stock: 50, supplier: 'Indofood', barcode: '8991101461416' },
  { name: 'Qtela Singkong 60g', category: 'Snack', price: 8000, purchasePrice: 6000, stock: 40, supplier: 'Garuda Food', barcode: '8996001520019' },
  { name: 'Piattos Keju 68g', category: 'Snack', price: 10000, purchasePrice: 7800, stock: 35, supplier: 'Indofood', barcode: '8991101461515' },

  // ROKOK
  { name: 'Sampoerna Mild 16', category: 'Rokok', price: 28000, purchasePrice: 25500, stock: 50, supplier: 'Sampoerna', barcode: '8993572000016' },
  { name: 'Gudang Garam Surya 16', category: 'Rokok', price: 27000, purchasePrice: 24500, stock: 50, supplier: 'Gudang Garam', barcode: '8999999550016' },
  { name: 'Marlboro Red 20', category: 'Rokok', price: 38000, purchasePrice: 35000, stock: 30, supplier: 'Philip Morris', barcode: '5012345678900' },
  { name: 'Djarum Super 16', category: 'Rokok', price: 25000, purchasePrice: 22500, stock: 40, supplier: 'Djarum', barcode: '8993460000016' },
  { name: 'LA Bold 16', category: 'Rokok', price: 26000, purchasePrice: 23500, stock: 35, supplier: 'Bentoel', barcode: '8993460100016' },

  // SEMBAKO
  { name: 'Beras Premium 5kg', category: 'Sembako', price: 75000, purchasePrice: 65000, stock: 20, supplier: 'Tani Maju', barcode: '8992700050013' },
  { name: 'Gula Pasir 1kg', category: 'Sembako', price: 16000, purchasePrice: 13500, stock: 30, supplier: 'Gulaku', barcode: '8993700010010' },
  { name: 'Minyak Goreng Bimoli 1L', category: 'Sembako', price: 20000, purchasePrice: 17000, stock: 25, supplier: 'Bimoli', barcode: '8996001900010' },
  { name: 'Tepung Terigu Segitiga 1kg', category: 'Sembako', price: 13000, purchasePrice: 10500, stock: 20, supplier: 'Bogasari', barcode: '8991201001007' },
  { name: 'Telur Ayam 1kg', category: 'Sembako', price: 28000, purchasePrice: 24000, stock: 15, supplier: 'Peternak Lokal', barcode: '8990000000001' },

  // KEBERSIHAN
  { name: 'Sabun Lifebuoy 80g', category: 'Kebersihan', price: 5000, purchasePrice: 3800, stock: 60, supplier: 'Unilever', barcode: '8851932041208' },
  { name: 'Shampo Pantene 70ml', category: 'Kebersihan', price: 9000, purchasePrice: 7000, stock: 45, supplier: 'P&G', barcode: '8001841618296' },
  { name: 'Pasta Gigi Pepsodent 75g', category: 'Kebersihan', price: 8000, purchasePrice: 6200, stock: 50, supplier: 'Unilever', barcode: '8851932010204' },
  { name: 'Deterjen Rinso 800g', category: 'Kebersihan', price: 25000, purchasePrice: 20000, stock: 30, supplier: 'Unilever', barcode: '8851932060223' },
  { name: 'Sunlight 755ml', category: 'Kebersihan', price: 18000, purchasePrice: 14500, stock: 35, supplier: 'Unilever', barcode: '8851932030202' },

  // KESEHATAN
  { name: 'Paracetamol 500mg (strip)', category: 'Kesehatan', price: 5000, purchasePrice: 3500, stock: 40, supplier: 'Kimia Farma', barcode: '8996001700001' },
  { name: 'Antangin JRG Sachet', category: 'Kesehatan', price: 3500, purchasePrice: 2500, stock: 60, supplier: 'Deltomed', barcode: '8997009000014' },
  { name: 'Tolak Angin Sachet', category: 'Kesehatan', price: 4000, purchasePrice: 3000, stock: 50, supplier: 'Sido Muncul', barcode: '8993663000015' },
  { name: 'Betadine 30ml', category: 'Kesehatan', price: 18000, purchasePrice: 14000, stock: 20, supplier: 'Mundipharma', barcode: '8992634000017' },
  { name: 'Masker Medis (50pcs)', category: 'Kesehatan', price: 35000, purchasePrice: 28000, stock: 25, supplier: 'OneMed', barcode: '8997700500015' },

  // ELEKTRONIK
  { name: 'Baterai ABC AA (2pcs)', category: 'Elektronik', price: 8000, purchasePrice: 6000, stock: 40, supplier: 'ABC', barcode: '8992699000020' },
  { name: 'Baterai ABC AAA (2pcs)', category: 'Elektronik', price: 7500, purchasePrice: 5500, stock: 35, supplier: 'ABC', barcode: '8992699000037' },
  { name: 'Lampu LED 5W Philips', category: 'Elektronik', price: 25000, purchasePrice: 19000, stock: 20, supplier: 'Philips', barcode: '8711500926692' },

  // AKSESORIS HP
  { name: 'Kabel Data USB-C 1m', category: 'Aksesoris HP', price: 25000, purchasePrice: 15000, stock: 15, supplier: 'Anker', barcode: '8996100000021' },
  { name: 'Earphone Basic 3.5mm', category: 'Aksesoris HP', price: 20000, purchasePrice: 12000, stock: 10, supplier: 'JBL KW', barcode: '8996100000038' },
  { name: 'Charger 10W Universal', category: 'Aksesoris HP', price: 35000, purchasePrice: 22000, stock: 8, supplier: 'Anker', barcode: '8996100000045' },

  // ALAT TULIS
  { name: 'Pulpen Pilot G-1 Hitam', category: 'Alat Tulis', price: 8000, purchasePrice: 5500, stock: 30, supplier: 'Pilot', barcode: '4902505163654' },
  { name: 'Buku Tulis Sidu 58 lembar', category: 'Alat Tulis', price: 5000, purchasePrice: 3500, stock: 50, supplier: 'Sidu', barcode: '8992700580013' },
  { name: 'Pensil 2B Faber Castell', category: 'Alat Tulis', price: 3500, purchasePrice: 2500, stock: 40, supplier: 'Faber Castell', barcode: '4005401176121' },
];

// ─────────────────────────────────────────────
// SEED FUNCTIONS
// ─────────────────────────────────────────────
async function seedCategories() {
  console.log('\n📂 Seeding categories...');
  const col = db.collection(`tenants/${TENANT_ID}/categories`);
  const now = admin.firestore.Timestamp.now();

  for (const name of categories) {
    await col.add({ name, createdAt: now });
    console.log(`  ✅ Category: ${name}`);
  }

  console.log(`\n✅ ${categories.length} categories seeded.`);
}

async function seedProducts() {
  console.log('\n📦 Seeding products...');
  const col = db.collection(`tenants/${TENANT_ID}/products`);
  const now = admin.firestore.Timestamp.now();

  // Buat variasi soldCount agar data terlihat hidup
  const soldVariants = [0, 5, 12, 23, 45, 78, 102, 200, 350, 500];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const soldCount = soldVariants[i % soldVariants.length];

    await col.add({
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

    console.log(`  ✅ Product [${i + 1}/${products.length}]: ${p.name}`);
  }

  console.log(`\n✅ ${products.length} products seeded.`);
}

// ─────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting seed...');
  console.log(`📍 Tenant ID: ${TENANT_ID}`);

  await seedCategories();
  await seedProducts();

  console.log('\n🎉 Seed selesai! Cek Firebase Console kamu.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});