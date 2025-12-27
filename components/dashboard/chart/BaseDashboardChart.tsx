import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { COLORS } from '../../../constants/colors';
import { TrendingUp, Calendar } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface BaseChartProps {
  data?: { value: number; label?: string }[];
  isLoading?: boolean;
  selectedPreset: 'today' | 'week' | 'month' | 'year';
  title?: string;
  accentColor?: string;
  dateRangeLabel?: string;  // 👈 footer label
}

export const BaseDashboardChart: React.FC<BaseChartProps> = ({
  data,
  isLoading,
  selectedPreset,
  title = "Tren Penjualan",
  accentColor = COLORS.primary,
  dateRangeLabel
}) => {

  const getDefaultLabels = () => {
    switch (selectedPreset) {
      case 'today': return ['06', '12', '18', '00'];
      case 'week': return ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      case 'month': return ['Mg1', 'Mg2', 'Mg3', 'Mg4'];
      case 'year': return ['1', '4', '7', '10'];
      default: return [];
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


  const chartData = data && data.length > 0 ? data : [{ value: 0 }, { value: 0 }];

  const values = chartData.map(d => d.value);
  const labels = data && data.length > 0
    ? data.map(d => d.label ?? '')
    : getDefaultLabels();

  const totalValue = values.reduce((sum, v) => sum + v, 0);
  const hasValidData = totalValue > 0;

  const chartConfig = {
    backgroundColor: "#FFF",
    backgroundGradientFrom: "#FFF",
    backgroundGradientTo: "#FFF",
    decimalPlaces: 0,
    color: () => accentColor,
    labelColor: () => COLORS.textLight,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#FFF"
    },
    propsForBackgroundLines: {
      strokeDasharray: "0",
      stroke: "#F0F0F0",
    }
  };

  return (
    <View style={styles.card}>

      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
          <TrendingUp size={18} color={accentColor} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Total: Rp {totalValue.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* ---------- CHART AREA ---------- */}
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>

          {isLoading ? (
            <ActivityIndicator size="large" color={accentColor} />
          ) : hasValidData ? (
            <LineChart
              data={{
                labels,
                datasets: [{ data: values }]
              }}
              width={SCREEN_WIDTH - 80}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              withVerticalLines
              withHorizontalLines
              withInnerLines
              withOuterLines={false}
              yAxisLabel="Rp "
              formatYLabel={(val) => {
                const num = parseInt(val);
                if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
                if (num >= 1000) return (num / 1000) + 'rb';
                return val;
              }}
              verticalLabelRotation={0}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>
                Belum ada data transaksi
              </Text>
            </View>
          )}

          {/* X-Axis Hint */}
{getXAxisLabelHint() !== '' && (
  <View style={styles.xAxisHintWrapper}>
    <Text style={styles.xAxisHintText}>
      {getXAxisLabelHint()}
    </Text>
  </View>
)}


        </View>
      </View>

      {/* ---------- FOOTER DATE RANGE ---------- */}
      {dateRangeLabel && (
        <View style={styles.footer}>
          <Calendar size={12} color={COLORS.textLight} />
          <Text style={styles.footerText}>{dateRangeLabel}</Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginVertical: 10,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  iconBox: { padding: 8, borderRadius: 12, marginRight: 12 },
  titleContainer: { flex: 1 },
  title: {
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.textDark
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight
  },

  /* Chart */
  chartWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 248, 248, 0.3)',
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

  /* Footer date range */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#F2F2F2',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
    color: COLORS.textLight,
  },
  xAxisHintWrapper: {
  marginTop: 6,
  marginBottom: 2,
  alignItems: 'center',
},

xAxisHintText: {
  fontSize: 11,
  fontFamily: 'PoppinsMedium',
  color: COLORS.textLight,
},

});
