import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  onPress: () => void;
}

const FloatingAddButton = ({ onPress }: Props) => (
  <TouchableOpacity style={styles.fab} onPress={onPress}>
    <Plus size={28} color="#FFF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});

export default FloatingAddButton;