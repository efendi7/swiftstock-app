import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from "react-native-gifted-charts";
import { COLORS } from '../../../constants/colors';
import { TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export interface BaseChartProps {
  data?: any[];
  isLoading?: boolean;
  selectedPreset: 'today' | 'week' | 'month' | 'year';
  title?: string;
  accentColor?: string;
}

export const BaseDashboardChart: React.FC<BaseChartProps> = ({ 
  data, 
  isLoading, 
  selectedPreset,
  title = "Tren Penjualan",
  accentColor = COLORS.primary
}) => {
  
  const getDefaultData = () => {
    switch (selectedPreset) {
      case 'today': return [{value:0,label:'06'},{value:0,label:'09'},{value:0,label:'12'},{value:0,label:'15'},{value:0,label:'18'},{value:0,label:'21'},{value:0,label:'24'},{value:0,label:'03'}];
      case 'week': return [{value:0,label:'Sen'},{value:0,label:'Sel'},{value:0,label:'Rab'},{value:0,label:'Kam'},{value:0,label:'Jum'},{value:0,label:'Sab'},{value:0,label:'Min'}];
      case 'month': return [{value:0,label:'Mg 1'},{value:0,label:'Mg 2'},{value:0,label:'Mg 3'},{value:0,label:'Mg 4'}];
      case 'year': return [{value:0,label:'Jan'},{value:0,label:'Feb'},{value:0,label:'Mar'},{value:0,label:'Apr'},{value:0,label:'Mei'},{value:0,label:'Jun'},{value:0,label:'Jul'},{value:0,label:'Agu'},{value:0,label:'Sep'},{value:0,label:'Okt'},{value:0,label:'Nov'},{value:0,label:'Des'}];
      default: return [];
    }
  };

  const chartData = data && data.length > 0 ? data : getDefaultData();
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...chartData.map(item => item.value));
  const hasValidData = totalValue > 0;

  const getPeriodText = () => {
    if (selectedPreset === 'today') return 'Hari Ini';
    if (selectedPreset === 'week') return '7 Hari Terakhir';
    if (selectedPreset === 'month') return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    if (selectedPreset === 'year') return new Date().getFullYear().toString();
    return '';
  };

  return (
    <View style={[styles.card, { opacity: isLoading ? 0.7 : 1 }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
          <TrendingUp size={18} color={accentColor} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Total: Rp {totalValue.toLocaleString('id-ID')}</Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        {hasValidData ? (
          <LineChart
            areaChart curved animateOnDataChange
            data={chartData}
            width={width - 80}
            height={180}
            spacing={(width - 80) / (chartData.length + 1)}
            color={accentColor}
            thickness={3}
            dataPointsColor={accentColor}
            startFillColor={`${accentColor}4D`}
            endFillColor={`${accentColor}03`}
            maxValue={maxValue > 0 ? maxValue * 1.2 : 100}
            yAxisThickness={0} xAxisThickness={1} hideYAxisText disableScroll
            pointerConfig={{
              pointerStripColor: accentColor,
              pointerLabelComponent: (items: any) => (
                <View style={styles.tooltipContainer}>
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipDay}>{items[0].label}</Text>
                    <Text style={styles.tooltipValue}>Rp {items[0].value.toLocaleString('id-ID')}</Text>
                  </View>
                </View>
              ),
            }}
            xAxisLabelTextStyle={styles.xAxisText}
          />
        ) : (
          <View style={styles.emptyChart}>
            {isLoading ? <ActivityIndicator size="large" color={accentColor} /> : <Text style={styles.emptyChartText}>Tidak ada data transaksi</Text>}
          </View>
        )}
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
    elevation: 2, // ✨ Reduced for modern look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f5f5f5',
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
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
    letterSpacing: -0.2,
  },
  chartWrapper: {
    height: 200, // ✨ Fixed height
    width: '100%',
    alignItems: 'center', // ✨ FIXED: Center horizontally
    justifyContent: 'center', // ✨ FIXED: Center vertically
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
    width: width - 80, // ✨ FIXED: Match chart width
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16, // ✨ More rounded
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed', // ✨ Dashed border for empty state
  },
  emptyChartText: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.textLight,
    marginBottom: 6,
    marginTop: 8,
  },
  emptyChartSubtext: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  weekRangeContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    alignItems: 'center',
  },
  weekRangeText: {
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
    color: COLORS.textLight,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    letterSpacing: -0.2,
  },
});