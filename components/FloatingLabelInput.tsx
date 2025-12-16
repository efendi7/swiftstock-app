// components/FloatingLabelInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
  TextInputProps,
  Platform,
  Easing,
} from 'react-native';

// --- KONSTANTA DESAIN ---
const FORM_BACKGROUND = '#FFFFFF';
const BORDER_COLOR_NORMAL = '#bdc3c7';
const BORDER_COLOR_FOCUSED = '#3498db';
const LABEL_COLOR_NORMAL = '#7f8c8d';
const LABEL_COLOR_FOCUSED = '#34495e';
const LABEL_COLOR_ACTIVE = '#3498db';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isFocused?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  isFocused: externalIsFocused,
  ...rest
}) => {
  const [internalIsFocused, setInternalIsFocused] = useState(false);
  const isFocused = externalIsFocused ?? internalIsFocused;
  
  // Gunakan useNativeDriver: true untuk transform
  const floatAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    const shouldFloat = isFocused || value.length > 0;
    
    Animated.timing(floatAnim, {
      toValue: shouldFloat ? 1 : 0,
      duration: 200, // Durasi lebih pendek untuk responsif
      easing: Easing.out(Easing.cubic), // Easing curve yang smooth
      useNativeDriver: true, // PENTING: true untuk smooth animation
    }).start();
  }, [isFocused, value, floatAnim]);

  // --- Interpolasi untuk Transform (Native Driver Compatible) ---
  const START_Y = 0; // Posisi tengah field (karena container pakai justifyContent: center)
  const END_Y = -30; // Posisi cut-out border (dinaikkan untuk kompensasi scale)

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [START_Y, END_Y],
  });

  const scale = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.75], // Scale down label
  });

  const opacity = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.8, 1],
  });

  // Warna dihandle via state, bukan animated interpolation
  const labelColor = isFocused 
    ? LABEL_COLOR_ACTIVE 
    : (value ? LABEL_COLOR_FOCUSED : LABEL_COLOR_NORMAL);
  
  const borderColor = isFocused ? BORDER_COLOR_FOCUSED : BORDER_COLOR_NORMAL;

  return (
    <View 
      style={[
        styles.container, 
        { 
          borderColor: borderColor,
          backgroundColor: FORM_BACKGROUND,
        }
      ]}
    >
      {/* Label Animasi dengan Native Driver */}
      <Animated.Text
        style={[
          styles.label,
          {
            transform: [
              { translateY },
              { translateX: -5 },
              { scale }, // Tambah scale untuk efek lebih smooth
            ],
            opacity, // Opacity transition
            color: labelColor, // Static color (no animation)
            backgroundColor: FORM_BACKGROUND,
          },
        ]}
      >
        {label}
      </Animated.Text>

      {/* Input */}
      <TextInput
        {...rest}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setInternalIsFocused(true)}
        onBlur={() => setInternalIsFocused(false)}
        placeholder=""
        placeholderTextColor="#bdc3c7"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
    paddingHorizontal: 5,
    fontSize: 16, // Base font size
    fontWeight: '400',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#34495e',
    paddingTop: 18,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
});

export default FloatingLabelInput;