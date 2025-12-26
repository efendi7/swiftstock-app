import React from 'react';
import { BaseDashboardChart, BaseChartProps } from '../../../../../components/dashboard/chart/BaseDashboardChart';
import { COLORS } from '../../../../../constants/colors';

export const CashierDashboardChart: React.FC<BaseChartProps> = (props) => {
  return (
    <BaseDashboardChart 
      {...props}
      title="Tren Penjualan Saya"
      accentColor={COLORS.primary} // Kasir menggunakan warna primary
    />
  );
};