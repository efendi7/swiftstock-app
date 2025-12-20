import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from "react-native-gifted-charts";
import { COLORS } from '../../constants/colors';
import { TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DashboardChartProps {
  data?: any[];
  isLoading?: boolean;
  selectedPreset: 'today' | 'week' | 'month' | 'year';
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ 
  data, 
  isLoading, 
  selectedPreset 
}) => {
  // Generate default data based on selected preset
  const getDefaultData = () => {
    switch (selectedPreset) {
      case 'today':
        return [
          { value: 0, label: '06' }, { value: 0, label: '09' },
          { value: 0, label: '12' }, { value: 0, label: '15' },
          { value: 0, label: '18' }, { value: 0, label: '21' },
          { value: 0, label: '24' }, { value: 0, label: '03' }
        ];
      case 'week':
        return [
          { value: 0, label: 'Sen' }, { value: 0, label: 'Sel' },
          { value: 0, label: 'Rab' }, { value: 0, label: 'Kam' },
          { value: 0, label: 'Jum' }, { value: 0, label: 'Sab' },
          { value: 0, label: 'Min' }
        ];
      case 'month':
        return [
          { value: 0, label: 'Mg 1' }, { value: 0, label: 'Mg 2' },
          { value: 0, label: 'Mg 3' }, { value: 0, label: 'Mg 4' }
        ];
      case 'year':
        return [
          { value: 0, label: 'Jan' }, { value: 0, label: 'Feb' },
          { value: 0, label: 'Mar' }, { value: 0, label: 'Apr' },
          { value: 0, label: 'Mei' }, { value: 0, label: 'Jun' },
          { value: 0, label: 'Jul' }, { value: 0, label: 'Agu' },
          { value: 0, label: 'Sep' }, { value: 0, label: 'Okt' },
          { value: 0, label: 'Nov' }, { value: 0, label: 'Des' }
        ];
      default:
        return [];
    }
  };

  const defaultData = getDefaultData();
  const chartData = data && data.length > 0 ? data : defaultData;
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...chartData.map(item => item.value));
  const hasValidData = totalValue > 0;

  const getPeriodText = () => {
    switch (selectedPreset) {
      case 'today':
        return 'Hari Ini';
      case 'week':
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const formatDate = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}`;
        return `${formatDate(monday)} - ${formatDate(sunday)}`;
      case 'month':
        const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        return currentMonth;
      case 'year':
        return new Date().getFullYear().toString();
      default:
        return '';
    }
  };

  const getChartWidth = () => {
    const baseWidth = width - 100;
    // Adjust spacing based on number of data points
    return baseWidth;
  };

  const getSpacing = () => {
    const baseWidth = width - 100;
    const dataPoints = chartData.length;
    return baseWidth / dataPoints;
  };

  return (
    <View style={[styles.card, { opacity: isLoading ? 0.7 : 1 }]}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <TrendingUp size={18} color={COLORS.primary} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tren Penjualan</Text>
          <Text style={styles.subtitle}>
            Total: Rp {totalValue.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <View style={{ height: 200, width: '100%', justifyContent: 'center' }}>
          {hasValidData ? (
            <LineChart
              areaChart
              curved
              data={chartData}
              width={getChartWidth()}
              height={180}
              hideDataPoints={false}
              dataPointsColor={COLORS.primary}
              spacing={getSpacing()}
              color={COLORS.primary}
              thickness={3}
              startFillColor="rgba(20, 158, 136, 0.3)"
              endFillColor="rgba(20, 158, 136, 0.01)"
              maxValue={maxValue > 0 ? maxValue * 1.2 : 100}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#E5E7EB"
              hideYAxisText
              disableScroll
              animateOnDataChange={true} 
              animationDuration={500}
              pointerConfig={{
                pointerStripHeight: 180,
                pointerStripColor: COLORS.primary,
                pointerStripWidth: 2,
                strokeDashArray: [4, 4],
                pointerLabelComponent: (items: any) => {
                  const item = items[0];
                  return (
                    <View style={styles.tooltipContainer}>
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipDay}>{item.label}</Text>
                        <Text style={styles.tooltipValue}>
                          Rp {item.value.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      <View style={styles.tooltipArrow} />
                    </View>
                  );
                },
              }}
              xAxisLabelTextStyle={styles.xAxisText}
            />
          ) : (
            <View style={styles.emptyChart}>
              {isLoading ? (
                 <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <Text style={styles.emptyChartText}>Tidak ada data</Text>
                  <Text style={styles.emptyChartSubtext}>Periode ini belum memiliki transaksi</Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.weekRangeContainer}>
        <Text style={styles.weekRangeText}>Periode: {getPeriodText()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    padding: 8,
    backgroundColor: '#E8F5F3',
    borderRadius: 12,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  xAxisText: {
    fontFamily: 'PoppinsMedium',
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 5,
  },
  tooltipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    backgroundColor: COLORS.textDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.textDark,
    marginTop: -1,
  },
  tooltipDay: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    marginBottom: 4,
    opacity: 0.9,
  },
  tooltipValue: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'PoppinsBold',
    marginBottom: 2,
  },
  emptyChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    width: width - 100,
  },
  emptyChartText: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  emptyChartSubtext: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
    opacity: 0.7,
  },
  weekRangeContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  weekRangeText: {
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
    color: COLORS.textLight,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});