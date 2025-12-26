import React, { ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';

interface HeaderActionsProps {
  onLogout: () => void;
  renderNotification?: () => ReactNode;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({ onLogout, renderNotification }) => (
  <View style={styles.container}>
    {renderNotification && renderNotification()}
    <TouchableOpacity style={styles.logoutCircle} onPress={onLogout}>
      <LogOut size={18} color="#FFF" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutCircle: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center' 
  },
});