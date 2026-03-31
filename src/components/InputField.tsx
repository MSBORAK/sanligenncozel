import React, { useState } from 'react';
import { Animated, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

type Props = TextInputProps & {
  icon: string | React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Glass-style input with left icon, focus glow, and subtle scale feedback.
 */
export const InputField: React.FC<Props> = ({ icon, containerStyle, ...inputProps }) => {
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
        { transform: [{ scale }] },
      ]}
    >
      <View style={styles.iconSlot}>
        {typeof icon === 'string' ? <Text style={styles.iconText}>{icon}</Text> : icon}
      </View>
      <TextInput
        {...inputProps}
        style={styles.input}
        placeholderTextColor="rgba(255,255,255,0.55)"
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
      {focused ? <View style={styles.focusGlow} /> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    overflow: 'hidden',
  },
  wrapperFocused: {
    borderColor: '#6366F1',
    shadowOpacity: 0.4,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  focusGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
  },
});
