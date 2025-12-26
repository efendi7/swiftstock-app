import React from 'react';
import { BaseProductRanking } from '../../../../../components/dashboard/ranking/BaseProductRanking';
import { ProductStat } from '../../../../../types/dashboard.types';
import { COLORS } from '../../../../../constants/colors';

interface AdminRankingProps {
  data: ProductStat[];
  onSeeMore?: () => void;
  // Menambahkan title, unit, color ke interface agar error TS hilang
  title?: string;
  unit?: string;
  color?: string;
}

export const AdminSalesRanking: React.FC<AdminRankingProps> = ({ 
  data, 
  onSeeMore,
  title = "Ranking Penjualan Produk", // Default value
  unit = "Pcs",
  color = COLORS.secondary
}) => {
  return (
    <BaseProductRanking
      title={title}
      data={data}
      unit={unit}
      color={color}
      onSeeMore={onSeeMore}
      defaultSortAsc={false}
      limit={10}
    />
  );
};

export const AdminStockRanking: React.FC<AdminRankingProps> = ({ 
  data, 
  onSeeMore,
  title = "Analisis Stok Kritis",
  unit = "Sisa",
  color = COLORS.danger
}) => {
  return (
    <BaseProductRanking
      title={title}
      data={data}
      unit={unit}
      color={color}
      onSeeMore={onSeeMore}
      defaultSortAsc={true} // Kritis berarti dari yang terkecil
      limit={10}
    />
  );
};