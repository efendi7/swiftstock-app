/**
 * ==========================================
 * FIXED useDashboard.ts - SESUAI STRUKTUR ASLI
 * ==========================================
 * 
 * File: src/hooks/useDashboard.ts
 * 
 * PERUBAHAN:
 * - Tambahkan tenantId dari useAuth
 * - Pass tenantId ke semua DashboardService calls
 * - Fix TypeScript errors
 */

import { useState, useCallback, useEffect } from 'react';
import { DashboardService } from '../services/dashboardService';
import { DashboardStats, DateRange } from '../types/dashboard.types';
import { useAuth } from './auth/useAuth'; // ✅ IMPORT useAuth

export const useDashboard = () => {
  // ✅ GET TENANT ID FROM AUTH
  const { tenantId, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0, 
    totalTransactions: 0, 
    totalRevenue: 0, 
    totalExpense: 0,
    totalProfit: 0, 
    lowStockCount: 0, 
    totalIn: 0, 
    totalOut: 0, 
    weeklyData: [],
    stockRanking: [],
    salesRanking: [],
  });

  const [dateRange, setDateRange] = useState<DateRange>(
    DashboardService.getPresetDateRange('today')
  );
  const [selectedPreset, setSelectedPreset] = useState<'today' | 'week' | 'month' | 'year'>('today');

  // ============================================
  // REAL-TIME LISTENER UNTUK ACTIVITIES
  // ============================================
  useEffect(() => {
    // ✅ Don't subscribe if no tenantId yet
    if (!tenantId || authLoading) {
      console.log('⏳ Waiting for tenantId before setting up activity listener...');
      return;
    }

    console.log('🔥 Setting up real-time activity listener for tenant:', tenantId);
    
    // ✅ Subscribe dengan tenantId
    const unsubscribe = DashboardService.subscribeToRecentActivities(
      tenantId, // ← TAMBAHAN PARAMETER INI
      20, // Ambil 20 aktivitas terbaru
      (newActivities: any[]) => { // ✅ Fix: Add type annotation
        console.log('📡 Real-time activities update:', newActivities.length);
        setActivities(newActivities);
      }
    );

    // Cleanup saat hook unmount
    return () => {
      console.log('🧹 Cleaning up activity listener...');
      unsubscribe();
    };
  }, [tenantId, authLoading]); // ✅ Add tenantId and authLoading to dependencies

  // ============================================
  // REFRESH DATA (STATS ONLY)
  // ============================================
  const refreshData = useCallback(async (
    customRange?: DateRange, 
    preset?: 'today' | 'week' | 'month' | 'year'
  ) => {
    // ✅ Don't fetch if no tenantId yet
    if (!tenantId) {
      console.log('⏳ Waiting for tenantId before refreshing data...');
      return;
    }

    setLoading(true);
    try {
      const targetRange = customRange || dateRange;
      const targetPreset = preset || selectedPreset;
      
      // ✅ Pass tenantId as first parameter
      const data = await DashboardService.fetchDashboardStats(
        tenantId, // ← TAMBAHAN PARAMETER INI
        targetRange, 
        targetPreset
      );

      setStats(data);
      
      if (customRange) setDateRange(customRange);
      if (preset) setSelectedPreset(preset);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateRange, selectedPreset]); // ✅ Add tenantId to dependencies

  const setPresetRange = useCallback((preset: 'today' | 'week' | 'month' | 'year') => {
    const range = DashboardService.getPresetDateRange(preset);
    refreshData(range, preset);
  }, [refreshData]);

  // ============================================
  // INITIAL LOAD - Wait for tenantId
  // ============================================
  useEffect(() => { 
    if (tenantId && !authLoading) {
      console.log('✅ TenantId ready, loading dashboard data...');
      refreshData(); 
    }
  }, [tenantId, authLoading]); // ✅ Trigger when tenantId is ready

  return { 
    loading: loading || authLoading, // ✅ Include authLoading in loading state
    stats, 
    activities, // Real-time activities
    dateRange, 
    selectedPreset, 
    refreshData, 
    setPresetRange,
    tenantId // ✅ Expose tenantId (opsional, untuk debugging)
  };
};