import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  ScrollView,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

const COLORS = {
  primary: '#00A79D',
  borderNormal: '#E2E8F0',
  labelNormal: '#94A3B8',
  text: '#1E293B',
  textDisabled: '#94A3B8',
  background: '#FFFFFF',
  backgroundDisabled: '#F8FAFC',
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

const FloatingLabelInput = forwardRef<any, FloatingLabelInputProps>(({
  label,
  value,
  onChangeText,
  icon,
  isPassword,
  inputStyle,
  labelStyle,
  onFocusCallback,
  editable = true,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secure, setSecure] = useState(!!isPassword);
  const containerRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);

  // Expose ref ke parent
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  const floatAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(floatAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFocused, value]);

  // Interpolasi Animasi
  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25], 
  });

  const scale = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const translateX = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [icon ? 28 : 0, -2],
  });

  const labelColor = isFocused ? COLORS.primary : COLORS.labelNormal;
  const borderColor = isFocused ? COLORS.primary : COLORS.borderNormal;
  const backgroundColor = editable ? COLORS.background : COLORS.backgroundDisabled;

  const handleFocus = () => {
    if (!editable) return;
    setIsFocused(true);
    if (onFocusCallback && containerRef.current) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        onFocusCallback(pageY);
      });
    }
  };

  return (
    <View ref={containerRef} style={[styles.container, { borderColor, backgroundColor }]}>
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            transform: [{ translateY }, { translateX }, { scale }],
            color: labelColor,
            backgroundColor: backgroundColor, // Background label harus sama dengan container
          },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>

      <View style={styles.inputRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        {!editable && value ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            <Text style={[styles.readOnlyText, inputStyle]}>
              {value}
            </Text>
          </ScrollView>
        ) : (
          <TextInput
            {...rest}
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            style={[
              styles.input, 
              inputStyle, 
              !editable && styles.inputDisabled,
              Platform.OS === 'web' && { outlineStyle: 'none' } as any
            ]}
            secureTextEntry={secure}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            placeholder=""
            editable={editable}
            selectionColor={COLORS.primary}
          />
        )}

        {isPassword && editable && (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eyeIcon}
            activeOpacity={0.5}
          >
            {secure ? (
              <EyeOff size={18} color={COLORS.labelNormal} />
            ) : (
              <Eye size={18} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 4,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    zIndex: 1,
    // Menghindari label menutupi border saat mengambang
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  iconContainer: {
    marginRight: 8,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'PoppinsMedium',
    height: '100%',
    padding: 0,
  },
  inputDisabled: {
    color: COLORS.textDisabled,
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  readOnlyText: {
    fontSize: 14,
    color: COLORS.textDisabled,
    fontFamily: 'PoppinsMedium',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
});

export default FloatingLabelInput;