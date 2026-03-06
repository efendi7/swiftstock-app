import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { TrendingUp, Calendar } from 'lucide-react-native';

import { COLORS } from '../../../constants/colors';
import { BaseCard } from '../../ui/BaseCard';

export interface BaseChartProps {
  data?: { value: number; label?: string }[];
  isLoading?: boolean;
  selectedPreset: 'today' | 'week' | 'month' | 'year';
  title?: string;
  accentColor?: string;
  dateRangeLabel?: string;
}

export const BaseDashboardChart: React.FC<BaseChartProps> = ({
  data,
  isLoading = false,
  selectedPreset,
  title = 'Tren Penjualan',
  accentColor = COLORS.primary,
  dateRangeLabel,
}) => {
  // ✅ FIX: Gunakan useWindowDimensions untuk responsif di web
  const { width: windowWidth } = useWindowDimensions();
  
  // ✅ Hitung lebar chart yang responsif
  const getChartWidth = () => {
    if (Platform.OS === 'web') {
      // Di web, ambil 90% dari container (dengan max width)
      return Math.min(windowWidth * 0.5, 800); // Max 800px untuk chart
    }
    // Di mobile, pakai lebar layar dikurangi padding
    return windowWidth - 80;
  };

  const getDefaultLabels = () => {
    switch (selectedPreset) {
      case 'today':
        return ['06', '12', '18', '00'];
      case 'week':
        return ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      case 'month':
        return ['Mg1', 'Mg2', 'Mg3', 'Mg4'];
      case 'year':
        return ['1', '4', '7', '10'];
      default:
        return [];
    }
  };

  const getXAxisLabelHint = () => {
    switch (selectedPreset) {
      case 'today':
        return 'Pukul (Jam)';
      case 'week':
        return 'Hari';
      case 'month':
        return 'Minggu ke-';
      case 'year':
        return 'Bulan';
      default:
        return '';
    }
  };

  const chartData =
    data && data.length > 0 ? data : [{ value: 0 }, { value: 0 }];

  const values = chartData.map(d => d.value);
  const labels =
    data && data.length > 0
      ? data.map(d => d.label ?? '')
      : getDefaultLabels();

  const totalValue = values.reduce((sum, v) => sum + v, 0);
  const hasValidData = totalValue > 0;

  const chartConfig = {
    backgroundColor: '#FFF',
    backgroundGradientFrom: '#FFF',
    backgroundGradientTo: '#FFF',
    decimalPlaces: 0,
    color: () => accentColor,
    labelColor: () => COLORS.textLight,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#FFF',
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: '#F0F0F0',
    },
  };

  return (
    <BaseCard variant="ultraSoft" style={styles.card}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: `${accentColor}15` },
          ]}
        >
          <TrendingUp size={18} color={accentColor} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Total: Rp {totalValue.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* ---------- CHART ---------- */}
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={accentColor} />
          ) : hasValidData ? (
            <LineChart
              data={{
                labels,
                datasets: [{ data: values }],
              }}
              width={getChartWidth()}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              withVerticalLines
              withHorizontalLines
              withInnerLines
              withOuterLines={false}
              yAxisLabel="Rp "
              formatYLabel={val => {
                const num = parseInt(val);
                if (num >= 1_000_000)
                  return (num / 1_000_000).toFixed(1) + 'jt';
                if (num >= 1_000) return num / 1_000 + 'rb';
                return val;
              }}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>
                Belum ada data transaksi
              </Text>
            </View>
          )}

          {getXAxisLabelHint() !== '' && (
            <View style={styles.xAxisHintWrapper}>
              <Text style={styles.xAxisHintText}>
                {getXAxisLabelHint()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ---------- FOOTER ---------- */}
      {dateRangeLabel && (
        <View style={styles.footer}>
          <Calendar size={12} color={COLORS.textLight} />
          <Text style={styles.footerText}>{dateRangeLabel}</Text>
        </View>
      )}
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingTop: 20,
    marginVertical: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  iconBox: {
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  titleContainer: { flex: 1 },
  title: {
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
  },

  chartWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(248,248,248,0.35)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },

  emptyChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontFamily: 'PoppinsMedium',
    color: COLORS.textLight,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#F3F3F3',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
    color: COLORS.textLight,
  },

  xAxisHintWrapper: {
    marginTop: 6,
    alignItems: 'center',
  },
  xAxisHintText: {
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
    color: COLORS.textLight,
  },
});