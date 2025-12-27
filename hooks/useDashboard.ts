import { useState, useCallback, useEffect } from 'react';
import { DashboardService } from '../services/dashboardService';
import { DashboardStats, DateRange } from '../types/dashboard.types';

export const useDashboard = () => {
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
    console.log('🔥 Setting up real-time activity listener...');
    
    // Subscribe ke aktivitas secara real-time
    const unsubscribe = DashboardService.subscribeToRecentActivities(
      20, // Ambil 20 aktivitas terbaru
      (newActivities) => {
        console.log('📡 Real-time activities update:', newActivities.length);
        setActivities(newActivities);
      }
    );

    // Cleanup saat hook unmount
    return () => {
      console.log('🧹 Cleaning up activity listener...');
      unsubscribe();
    };
  }, []); // Empty dependency - listener tetap aktif sepanjang lifecycle

  // ============================================
  // REFRESH DATA (STATS ONLY)
  // ============================================
  const refreshData = useCallback(async (
    customRange?: DateRange, 
    preset?: 'today' | 'week' | 'month' | 'year'
  ) => {
    setLoading(true);
    try {
      const targetRange = customRange || dateRange;
      const targetPreset = preset || selectedPreset;
      
      const data = await DashboardService.fetchDashboardStats(targetRange, targetPreset);

      setStats(data);
      
      if (customRange) setDateRange(customRange);
      if (preset) setSelectedPreset(preset);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedPreset]);

  const setPresetRange = useCallback((preset: 'today' | 'week' | 'month' | 'year') => {
    const range = DashboardService.getPresetDateRange(preset);
    refreshData(range, preset);
  }, [refreshData]);

  // Initial load
  useEffect(() => { 
    refreshData(); 
  }, []);

  return { 
    loading, 
    stats, 
    activities, // Real-time activities
    dateRange, 
    selectedPreset, 
    refreshData, 
    setPresetRange 
  };
};