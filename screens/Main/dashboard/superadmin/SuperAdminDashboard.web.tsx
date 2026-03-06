import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '@constants/colors';
import { db } from '@services/firebaseConfig';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react-native';

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  totalUsers: number;
}

interface Tenant {
  id: string;
  name: string;
  adminId: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionEndDate: string;
  createdAt: string;
}

const SuperAdminDashboardWeb = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TenantStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all tenants
      const tenantsRef = collection(db, 'tenants');
      const tenantsQuery = query(tenantsRef, orderBy('createdAt', 'desc'), limit(10));
      const tenantsSnapshot = await getDocs(tenantsQuery);
      
      const tenantsData: Tenant[] = [];
      tenantsSnapshot.forEach((doc) => {
        tenantsData.push({ id: doc.id, ...doc.data() } as Tenant);
      });

      // Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      // Calculate stats
      const totalTenants = tenantsData.length;
      const activeTenants = tenantsData.filter(t => t.subscriptionStatus === 'active').length;
      
      // Dummy revenue calculation (bisa diganti dengan data real)
      const planPrices: Record<string, number> = {
        free: 0,
        basic: 99000,
        premium: 299000,
      };
      const totalRevenue = tenantsData.reduce((sum, tenant) => {
        return sum + (planPrices[tenant.subscriptionPlan] || 0);
      }, 0);

      setStats({
        totalTenants,
        activeTenants,
        totalRevenue,
        totalUsers: usersSnapshot.size,
      });

      setTenants(tenantsData);
    } catch (error) {
      console.error('Error fetching superadmin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color 
  }: { 
    icon: any; 
    title: string; 
    value: string | number; 
    subtitle: string; 
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'suspended': return COLORS.warning;
      case 'cancelled': return COLORS.danger;
      default: return COLORS.textLight;
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'premium': return '#8B5CF6';
      case 'basic': return '#3B82F6';
      case 'free': return '#64748B';
      default: return COLORS.textLight;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading Super Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Super Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage all tenants and system overview</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchSuperAdminData}>
          <Text style={styles.refreshButtonText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={Building2}
            title="Total Tenants"
            value={stats.totalTenants}
            subtitle="Registered stores"
            color="#3B82F6"
          />
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            subtitle="All users in system"
            color={COLORS.secondary}
          />
          <StatCard
            icon={TrendingUp}
            title="Active Tenants"
            value={stats.activeTenants}
            subtitle="Currently subscribed"
            color={COLORS.success}
          />
          <StatCard
            icon={DollarSign}
            title="Monthly Revenue"
            value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
            subtitle="From subscriptions"
            color="#F59E0B"
          />
        </View>

        {/* TENANTS TABLE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Tenants</Text>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Store Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Plan</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>End Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Created</Text>
            </View>

            {/* Table Rows */}
            {tenants.map((tenant) => (
              <View key={tenant.id} style={styles.tableRow}>
                {/* ✅ FIX: Wrap Text dengan View */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.tableCellBold}>{tenant.name}</Text>
                </View>

                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <View style={[styles.planBadge, { backgroundColor: getPlanBadgeColor(tenant.subscriptionPlan) }]}>
                    <Text style={styles.planBadgeText}>{tenant.subscriptionPlan.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tenant.subscriptionStatus) + '15' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(tenant.subscriptionStatus) }]}>
                      {tenant.subscriptionStatus}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <Text style={styles.tableCellText}>
                    {new Date(tenant.subscriptionEndDate).toLocaleDateString('id-ID', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>

                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <Text style={styles.tableCellText}>
                    {new Date(tenant.createdAt).toLocaleDateString('id-ID', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footerBrand}>Swiftstock POS • Super Admin Panel</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: 'PoppinsRegular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'MontserratBold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'PoppinsRegular',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#FFF',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
  },
  scrollContent: { paddingBottom: 40 },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.04)' },
      default: { elevation: 2 },
    }),
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: { flex: 1 },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'PoppinsRegular',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'MontserratBold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'PoppinsRegular',
  },

  // TABLE
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)' },
      default: { elevation: 3 },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#1E293B',
    marginBottom: 20,
  },
  table: {},
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableCell: {
    // ✅ View style (tidak ada fontSize, fontFamily, color)
    justifyContent: 'center',
  },
  // ✅ Text styles terpisah
  tableCellText: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#1E293B',
  },
  tableCellBold: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#1E293B',
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  planBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'PoppinsSemiBold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: 'PoppinsSemiBold',
    textTransform: 'capitalize',
  },
  footerBrand: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 60,
    fontFamily: 'PoppinsRegular',
  },
});

export default SuperAdminDashboardWeb;