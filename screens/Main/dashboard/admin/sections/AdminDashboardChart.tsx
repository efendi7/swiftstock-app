import React from 'react';
import { BaseDashboardChart, BaseChartProps } from '../../../../../components/dashboard/chart/BaseDashboardChart';
import { COLORS } from '../../../../../constants/colors';

export const AdminDashboardChart: React.FC<BaseChartProps> = (props) => {
  return (
    <BaseDashboardChart 
      {...props}
      title="Analitik Penjualan Toko"
      accentColor={COLORS.secondary} // Admin identik dengan warna secondary Anda
    />
  );
};