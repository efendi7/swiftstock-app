import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  Package,
  BarChart2,
  User,
  PlusCircle,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface Props extends BottomTabBarProps {
  onFabPress: () => void;
}

export const BottomNavigation: React.FC<Props> = ({
  state,
  navigation,
  onFabPress,
  insets,
}) => {
  const currentRoute = state.routes[state.index].name;

  const isActive = (routeName: string) => currentRoute === routeName;

  return (
    <View style={[styles.footerWrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.navContainer}>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <LayoutDashboard
            size={24}
            color={isActive('AdminDashboard') ? COLORS.secondary : COLORS.textLight}
          />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Product')}
        >
          <Package
            size={24}
            color={isActive('Product') ? COLORS.secondary : COLORS.textLight}
          />
          <Text style={styles.navLabel}>Produk</Text>
        </TouchableOpacity>

        <View style={{ width: 75 }} />

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Transaction')}
        >
          <BarChart2
            size={24}
            color={isActive('Transaction') ? COLORS.secondary : COLORS.textLight}
          />
          <Text style={styles.navLabel}>Laporan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <User size={24} color={COLORS.textLight} />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.fabButton, { bottom: 25 + insets.bottom }]}
        onPress={onFabPress}
      >
        <LinearGradient
          colors={[COLORS.secondary, '#008e85']}
          style={styles.fabGradient}
        >
          <PlusCircle size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  navContainer: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', flex: 1 },
  navLabel: { fontSize: 10, marginTop: 4 },
  fabButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 6,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
