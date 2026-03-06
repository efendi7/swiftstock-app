import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

// Ini adalah kerangka global untuk versi Mobile
export const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* Konsistensi Status Bar di seluruh HP */}
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        {/* Tempat Navigasi Mobile (AppNavigator) akan di-render */}
        {children}
        
        {/* Tempat untuk Global Modal atau Toast agar tidak menumpuk di screen */}
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});