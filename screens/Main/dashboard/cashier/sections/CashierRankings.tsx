import React from 'react';
import { BaseProductRanking } from '../../../../../components/dashboard/ranking/BaseProductRanking';
import { ProductStat } from '../../../../../types/dashboard.types';
import { COLORS } from '../../../../../constants/colors';

interface CashierRankingProps {
  data: ProductStat[];
  onSeeMore?: () => void;
}

export const CashierSalesRanking: React.FC<CashierRankingProps> = ({ data, onSeeMore }) => {
  return (
    <BaseProductRanking
      title="Produk Terlaris Hari Ini"
      data={data}
      unit="Terjual"
      color={COLORS.primary}
      onSeeMore={onSeeMore}
      defaultSortAsc={false}
      limit={5}
    />
  );
};

export const CashierStockRanking: React.FC<CashierRankingProps> = ({ data, onSeeMore }) => {
  return (
    <BaseProductRanking
      title="Peringatan Stok Rak"
      data={data}
      unit="Pcs"
      color={COLORS.danger}
      onSeeMore={onSeeMore}
      defaultSortAsc={true}
      limit={5}
    />
  );
};