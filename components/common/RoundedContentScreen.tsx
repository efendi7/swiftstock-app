// components/common/RoundedContentScreen.tsx
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS } from '../../constants/colors';

interface RoundedContentScreenProps extends ViewProps {
  children: React.ReactNode;
}

export const RoundedContentScreen: React.FC<RoundedContentScreenProps> = ({
  children,
  style,
  ...rest
}) => {
  return (
    <View style={[styles.container, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,               // Overlap dengan header gradient
    overflow: 'hidden',           // Agar anak-anak ikut rounded
    // Optional: tambah shadow agar lebih "mengambang"
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
});