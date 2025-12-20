import { useState, useCallback, useEffect } from 'react';
import { DashboardService } from '../services/dashboardService';
import { DashboardStats, DateRange } from '../types/dashboard.types';

export const useDashboard = () => {
  const [loading, setLoading] = useState(false);
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
  });

  const [dateRange, setDateRange] = useState<DateRange>(
    DashboardService.getPresetDateRange('today')
  );
  const [selectedPreset, setSelectedPreset] = useState<'today' | 'week' | 'month' | 'year'>('today');

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

  useEffect(() => { 
    refreshData(); 
  }, []);

  return { 
    loading, 
    stats, 
    dateRange, 
    selectedPreset, 
    refreshData, 
    setPresetRange 
  };
};