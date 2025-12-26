import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { slides } from './onboardingData';
import { OnboardingItem } from './OnboardingItem';

export const OnboardingScreen = ({ navigation }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('@alreadyLaunched', 'true');
      navigation.replace('Login');
    } catch (e) {
      console.error('Error saving onboarding status', e);
    }
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        renderItem={({ item }) => <OnboardingItem item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={viewableItemsChanged}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        {/* Paginator Dots */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, i) => {
            const width = scrollX.interpolate({
              inputRange: [(i - 1) * 400, i * 400, (i + 1) * 400],
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View 
                key={i} 
                style={[
                    styles.dot, 
                    { width, backgroundColor: currentIndex === i ? COLORS.secondary : '#D1D1D1' }
                ]} 
              />
            );
          })}
        </View>

        {/* Tombol Aksi */}
        <TouchableOpacity onPress={nextSlide} activeOpacity={0.8}>
          <LinearGradient colors={[COLORS.primary, '#2c537a']} style={styles.button}>
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? "Mulai Sekarang" : "Selanjutnya"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {currentIndex < slides.length - 1 && (
            <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
                <Text style={styles.skipText}>Lewati</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  footer: { paddingHorizontal: 40, paddingBottom: 50 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { height: 10, borderRadius: 5, marginHorizontal: 5 },
  button: { paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 4 },
  buttonText: { color: '#FFF', fontFamily: 'PoppinsSemiBold', fontSize: 16 },
  skipBtn: { marginTop: 15, alignItems: 'center' },
  skipText: { color: '#999', fontFamily: 'PoppinsMedium', fontSize: 14 }
});