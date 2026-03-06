import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Store, Smartphone, Check, ArrowRight, BarChart3, Package, TrendingUp, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@constants/colors';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export const LandingPage = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* NAVBAR dengan Gradient Subtle */}
      <View style={styles.navbar}>
        <View style={styles.navContent}>
          <View style={styles.logoContainer}>
            <Store color={COLORS.primary} size={32} />
            <Text style={styles.logoText}>SwiftStock</Text>
          </View>
          <View style={styles.navActions}>
            {/* ✅ UPDATED: Auth → Login */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Masuk</Text>
            </TouchableOpacity>
            {/* ✅ UPDATED: Auth → Register */}
            <TouchableOpacity 
              style={styles.navCta} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.navCtaText}>Daftar Gratis</Text>
              <ArrowRight size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* HERO SECTION dengan Gradient Background */}
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#DBEAFE']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>✨ Platform Kasir Terpercaya</Text>
          </View>
          
          <Text style={styles.heroTitle}>
            Satu Aplikasi Kasir untuk{'\n'}
            <Text style={styles.heroTitleHighlight}>Seluruh Bisnis UMKM</Text> Anda
          </Text>
          
          <Text style={styles.heroSub}>
            Kelola stok di Web, layani pelanggan di Mobile.{'\n'}
            Sinkronisasi real-time dalam satu genggaman.
          </Text>
          
          <View style={styles.heroActions}>
            {/* ✅ UPDATED: Auth → Register */}
            <TouchableOpacity 
              style={styles.ctaBtn} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.ctaText}>Mulai Gratis</Text>
              <ArrowRight size={20} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.downloadBtn} 
              onPress={() => Linking.openURL('https://your-apk-link.com')}
            >
              <Smartphone color={COLORS.primary} size={20} />
              <Text style={styles.downloadText}>Download APK</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem value="1000+" label="Toko Aktif" />
            <StatItem value="50K+" label="Transaksi/Hari" />
            <StatItem value="4.9★" label="Rating User" />
          </View>
        </View>
      </LinearGradient>

      {/* FEATURES SECTION */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Fitur Unggulan</Text>
        <Text style={styles.sectionSubtitle}>
          Semua yang Anda butuhkan untuk mengelola bisnis modern
        </Text>

        <View style={styles.featuresGrid}>
          <FeatureCard 
            icon={<BarChart3 size={32} color={COLORS.primary} />}
            title="Dashboard Analytics"
            description="Pantau performa bisnis Anda secara real-time dengan visualisasi data yang mudah dipahami"
          />
          <FeatureCard 
            icon={<Package size={32} color={COLORS.primary} />}
            title="Manajemen Inventory"
            description="Kelola stok produk, atur kategori, dan dapatkan notifikasi stok menipis otomatis"
          />
          <FeatureCard 
            icon={<TrendingUp size={32} color={COLORS.primary} />}
            title="Laporan Penjualan"
            description="Analisis laba rugi, tren penjualan, dan laporan lengkap untuk keputusan bisnis"
          />
          <FeatureCard 
            icon={<Users size={32} color={COLORS.primary} />}
            title="Multi-User Access"
            description="Buat akun kasir, atur hak akses, dan monitor aktivitas karyawan dengan mudah"
          />
        </View>
      </View>

      {/* PRICING SECTION dengan Gradient Cards */}
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>Paket Harga Fleksibel</Text>
        <Text style={styles.sectionSubtitle}>
          Pilih paket yang sesuai dengan kebutuhan bisnis Anda
        </Text>
        
        <View style={styles.pricingRow}>
          {/* ✅ UPDATED: Auth → Register */}
          <PricingCard 
            title="Free Plan" 
            price="Rp 0" 
            features={[
              'Maksimal 50 Produk',
              '1 Akun Kasir',
              'Laporan Harian',
              'Support Email'
            ]} 
            onPress={() => navigation.navigate('Register')}
          />
          
          {/* ✅ UPDATED: Auth → Register */}
          <PricingCard 
            title="Pro Plan" 
            price="Rp 49K" 
            isPopular 
            features={[
              'Produk Unlimited',
              'Multi Kasir Unlimited',
              'Manajemen Stok Advanced',
              'Laporan Laba Rugi Detail',
              'Export Excel & PDF',
              'Priority Support 24/7'
            ]} 
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </View>

      {/* CTA SECTION */}
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.95)', 'rgba(37, 99, 235, 1)', 'rgba(29, 78, 216, 1)']}
        style={styles.ctaSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.ctaTitle}>Siap Meningkatkan Bisnis Anda?</Text>
        <Text style={styles.ctaSubtitle}>
          Bergabung dengan ribuan pemilik toko yang sudah menggunakan SwiftStock
        </Text>
        {/* ✅ UPDATED: Auth → Register */}
        <TouchableOpacity 
          style={styles.ctaBtnWhite} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.ctaBtnWhiteText}>Coba Gratis 30 Hari</Text>
          <ArrowRight size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>SwiftStock by Efendi • © 2026</Text>
      </View>
    </ScrollView>
  );
};

// Komponen StatItem
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Komponen FeatureCard
const FeatureCard = ({ icon, title, description }: any) => (
  <View style={styles.featureCard}>
    <View style={styles.featureIcon}>{icon}</View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{description}</Text>
  </View>
);

// Komponen PricingCard dengan Gradient
const PricingCard = ({ title, price, features, isPopular, onPress }: any) => (
  <View style={[styles.pCard, isPopular && styles.pCardPopular]}>
    {isPopular && (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.popularBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.pBadgeText}>⭐ PALING POPULER</Text>
      </LinearGradient>
    )}
    
    <Text style={styles.pTitle}>{title}</Text>
    <View style={styles.priceRow}>
      <Text style={styles.pPrice}>{price}</Text>
      <Text style={styles.pMonth}>/bulan</Text>
    </View>
    
    <View style={styles.pFeatureList}>
      {features.map((f: string, i: number) => (
        <View key={i} style={styles.pFeatureItem}>
          <View style={styles.checkIcon}>
            <Check size={14} color="#FFF" />
          </View>
          <Text style={styles.pFeatureText}>{f}</Text>
        </View>
      ))}
    </View>
    
    <TouchableOpacity 
      style={[styles.pBtn, isPopular && styles.pBtnActive]} 
      onPress={onPress}
    >
      <Text style={[styles.pBtnText, isPopular && styles.pBtnTextActive]}>
        Pilih Paket
      </Text>
      <ArrowRight size={16} color={isPopular ? '#FFF' : COLORS.primary} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  
  // Navbar
  navbar: { 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({
      web: { 
        position: 'sticky' as any, 
        top: 0, 
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }
    })
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { 
    fontSize: 24, 
    fontFamily: 'MontserratBold', 
    color: COLORS.primary 
  },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  loginLink: { 
    fontFamily: 'PoppinsSemiBold', 
    color: '#64748B',
    fontSize: 15,
  },
  navCta: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }
    })
  },
  navCtaText: { color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 14 },

  // Hero
  hero: { 
    padding: width > 768 ? 80 : 40,
    alignItems: 'center',
  },
  heroContent: { maxWidth: 900, alignItems: 'center' },
  heroBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  heroBadgeText: {
    color: COLORS.primary,
    fontFamily: 'PoppinsSemiBold',
    fontSize: 13,
  },
  heroTitle: { 
    fontSize: width > 768 ? 48 : 32, 
    textAlign: 'center', 
    fontFamily: 'MontserratBold', 
    color: '#1E293B', 
    lineHeight: width > 768 ? 60 : 40,
    marginBottom: 20,
  },
  heroTitleHighlight: {
    color: COLORS.primary,
  },
  heroSub: { 
    fontSize: width > 768 ? 18 : 16, 
    textAlign: 'center', 
    color: '#64748B', 
    lineHeight: 28, 
    fontFamily: 'PoppinsRegular',
    marginBottom: 40,
  },
  heroActions: { 
    flexDirection: width > 768 ? 'row' : 'column', 
    gap: 15, 
    width: width > 768 ? 'auto' : '100%',
  },
  ctaBtn: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }
    })
  },
  ctaText: { color: '#FFF', fontSize: 16, fontFamily: 'PoppinsBold' },
  downloadBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: COLORS.primary,
    backgroundColor: '#FFF',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }
    })
  },
  downloadText: { color: COLORS.primary, fontSize: 16, fontFamily: 'PoppinsBold' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 60,
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }
    })
  },
  statItem: { alignItems: 'center' },
  statValue: { 
    fontSize: 28, 
    fontFamily: 'MontserratBold', 
    color: COLORS.primary 
  },
  statLabel: { 
    fontSize: 13, 
    fontFamily: 'PoppinsRegular', 
    color: '#64748B',
    marginTop: 4,
  },

  // Features
  featuresSection: { 
    padding: width > 768 ? 80 : 40, 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  sectionTitle: { 
    fontSize: width > 768 ? 36 : 28, 
    fontFamily: 'MontserratBold', 
    marginBottom: 12, 
    color: '#1E293B',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 50,
    maxWidth: 600,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1200,
  },
  featureCard: {
    width: width > 768 ? 280 : '100%',
    padding: 32,
    backgroundColor: '#FFF',
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { 
        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
      }
    })
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Pricing
  pricingSection: { 
    padding: width > 768 ? 80 : 40, 
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  pricingRow: { 
    flexDirection: width > 768 ? 'row' : 'column', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 30,
    marginTop: 20,
  },
  pCard: { 
    width: width > 768 ? 360 : '100%',
    padding: 40, 
    borderRadius: 24, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 6 },
      web: { 
        boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
      }
    })
  },
  pCardPopular: { 
    borderColor: COLORS.primary, 
    borderWidth: 3,
    transform: [{ scale: width > 768 ? 1.05 : 1 }],
  },
  popularBadge: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    alignSelf: 'flex-start', 
    marginBottom: 20,
  },
  pBadgeText: { 
    color: '#FFF', 
    fontSize: 11, 
    fontFamily: 'PoppinsBold',
    letterSpacing: 0.5,
  },
  pTitle: { 
    fontSize: 16, 
    fontFamily: 'PoppinsSemiBold', 
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 16 },
  pPrice: { 
    fontSize: 40, 
    fontFamily: 'MontserratBold', 
    color: '#1E293B',
  },
  pMonth: { 
    fontSize: 16, 
    color: '#94A3B8',
    fontFamily: 'PoppinsRegular',
    marginLeft: 4,
  },
  pFeatureList: { marginVertical: 24, gap: 14 },
  pFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pFeatureText: { 
    color: '#475569', 
    fontSize: 14, 
    fontFamily: 'PoppinsRegular',
    flex: 1,
  },
  pBtn: { 
    width: '100%', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: COLORS.primary,
    alignItems: 'center', 
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }
    })
  },
  pBtnActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
  },
  pBtnText: { 
    fontFamily: 'PoppinsBold', 
    color: COLORS.primary,
    fontSize: 15,
  },
  pBtnTextActive: { color: '#FFF' },

  // CTA Section
  ctaSection: {
    padding: width > 768 ? 80 : 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: width > 768 ? 36 : 28,
    fontFamily: 'MontserratBold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
  },
  ctaBtnWhite: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }
    })
  },
  ctaBtnWhiteText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: 'PoppinsBold',
  },

  // Footer
  footer: { 
    padding: 40, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  footerText: { 
    color: '#94A3B8', 
    fontSize: 13, 
    fontFamily: 'PoppinsRegular' 
  }
});