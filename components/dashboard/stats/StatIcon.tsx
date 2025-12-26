import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface StatIconProps {
  icon: ReactNode;
  backgroundColor: string;
  size?: number;
  style?: ViewStyle;
}

export const StatIcon: React.FC<StatIconProps> = ({ icon, backgroundColor, size = 28, style }) => (
  <View style={[
    { 
      width: size, 
      height: size, 
      borderRadius: size / 2, 
      backgroundColor,
      justifyContent: 'center',
      alignItems: 'center'
    }, 
    style
  ]}>
    {icon}
  </View>
);