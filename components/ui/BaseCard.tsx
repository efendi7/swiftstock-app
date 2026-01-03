import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

type CardVariant = 'ultraSoft' | 'soft' | 'flat';

interface BaseCardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>; // ✅ PENTING
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  variant = 'ultraSoft',
  style,
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },

  ultraSoft: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0.4,
  },

  soft: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  flat: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
});
