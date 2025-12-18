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
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

const COLORS = {
  primary: '#00A79D',
  borderNormal: '#bdc3c7',
  labelNormal: '#7f8c8d',
  text: '#34495e',
  background: '#FFFFFF',
};

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  isPassword?: boolean;
  inputStyle?: object;
  labelStyle?: object;
  onFocusCallback?: (y: number) => void;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  icon,
  isPassword,
  inputStyle,
  labelStyle,
  onFocusCallback,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secure, setSecure] = useState(!!isPassword);
  const containerRef = useRef<View>(null);

  const floatAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(floatAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFocused, value]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -26], 
  });

  const scale = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.75],
  });

  const translateX = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [icon ? 30 : 0, icon ? -4 : 0],
  });

  const labelColor = isFocused ? COLORS.primary : COLORS.labelNormal;
  const borderColor = isFocused ? COLORS.primary : COLORS.borderNormal;

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocusCallback && containerRef.current) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        onFocusCallback(pageY);
      });
    }
  };

  return (
    <View ref={containerRef} style={[styles.container, { borderColor }]}>
      <Animated.Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.label,
          {
            transform: [{ translateY }, { translateX }, { scale }],
            color: labelColor,
            maxWidth: '90%', 
          },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>

      <View style={styles.inputRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <TextInput
          {...rest}
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, inputStyle]}
          secureTextEntry={secure}
          cursorColor={COLORS.primary}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          placeholder=""
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eyeIcon}
            activeOpacity={0.7}
          >
            {secure ? (
              <EyeOff size={18} color={isFocused ? COLORS.primary : COLORS.labelNormal} />
            ) : (
              <Eye size={18} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  label: {
    position: 'absolute',
    left: 10,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    zIndex: 1,
    top: 14,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginTop: 2,
  },
  iconContainer: {
    marginRight: 6,
    width: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'PoppinsRegular',
    ...Platform.select({
      android: {
        paddingVertical: 0,
        textAlignVertical: 'center',
      },
      ios: {
        paddingVertical: 6,
      }
    }),
  },
  eyeIcon: {
    paddingLeft: 6,
  },
});

export default FloatingLabelInput;