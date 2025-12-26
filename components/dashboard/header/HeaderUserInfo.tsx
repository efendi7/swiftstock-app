import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderUserInfoProps {
  role: string;
  displayName: string;
}

export const HeaderUserInfo: React.FC<HeaderUserInfoProps> = ({ role, displayName }) => (
  <View style={styles.container}>
    <Text style={styles.greeting}>Selamat Datang, {role}</Text>
    <Text style={styles.adminName} numberOfLines={1}>
      {displayName}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'PoppinsRegular' },
  adminName: { color: '#FFF', fontSize: 18, fontFamily: 'MontserratBold' },
});