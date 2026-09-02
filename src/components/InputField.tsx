import React, { useState } from 'react';
import { Animated, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Clean } from '@/constants/Colors';

type Props = TextInputProps & {
  icon: string | React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  /** true ise kenarlık kırmızıya döner (ör. geçersiz e-posta formatı) */
  error?: boolean;
};

/**
 * Bordered light input with left icon and focus accent border.
 */
export const InputField: React.FC<Props> = ({ icon, containerStyle, error, ...inputProps }) => {
  const [focused, setFocused] = useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        containerStyle,
        focused && styles.wrapperFocused,
        error && styles.wrapperError,
        { transform: [{ scale }] },
      ]}
    >
      <View style={styles.iconSlot}>
        {typeof icon === 'string' ? <Text style={styles.iconText}>{icon}</Text> : icon}
      </View>
      <TextInput
        {...inputProps}
        style={styles.input}
        placeholderTextColor={Clean.textMuted}
        onFocus={(event) => {
          setFocused(true);
          animateScale(1.015);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          animateScale(1);
          inputProps.onBlur?.(event);
        }}
        autoCapitalize={inputProps.autoCapitalize ?? 'none'}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#111114',
    backgroundColor: Clean.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapperFocused: {
    borderColor: Clean.accent,
  },
  wrapperError: {
    borderColor: '#e74c3c',
  },
  iconSlot: {
    width: 20,
    marginRight: 10,
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    color: Clean.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
});
