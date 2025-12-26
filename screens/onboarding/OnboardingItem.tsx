import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { COLORS } from '../../constants/colors';
import { OnboardingSlide } from './onboardingData'; // Import ini wajib ada

export const OnboardingItem = ({ item }: { item: OnboardingSlide }) => {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  imageContainer: { flex: 0.5, justifyContent: 'center', alignItems: 'center' },
  image: { width: 250, height: 250, resizeMode: 'contain' },
  textContainer: { flex: 0.3, alignItems: 'center', paddingHorizontal: 20 },
  title: {
    fontSize: 24,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12
  },
  description: {
    fontSize: 15,
    fontFamily: 'PoppinsRegular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22
  },
});