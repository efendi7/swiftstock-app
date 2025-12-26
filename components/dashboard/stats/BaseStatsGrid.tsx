import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

interface BaseStatsGridProps {
  dateLabel?: string;
  isLoading?: boolean;
  renderHeader: () => ReactNode;
  renderStats: () => ReactNode;
  containerStyle?: 'card' | 'flat';
}

export const BaseStatsGrid: React.FC<BaseStatsGridProps> = ({
  isLoading = false,
  renderHeader,
  renderStats,
  containerStyle = 'card',
}) => {
  const isCard = containerStyle === 'card';

  return (
    <View style={[isCard ? styles.mainCard : styles.flat, { opacity: isLoading ? 0.7 : 1 }]}>
      {renderHeader()}
      {renderStats()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  flat: { width: '100%', marginVertical: 10 },
});