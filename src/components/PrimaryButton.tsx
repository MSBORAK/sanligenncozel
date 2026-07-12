import React from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Clean } from '@/constants/Colors';

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Full-width dark call-to-action button with press feedback.
 */
export const PrimaryButton: React.FC<Props> = ({ label, onPress, style }) => {
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
    <Animated.View style={[styles.wrapper, style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateScale(0.96)}
        onPressOut={() => animateScale(1)}
        style={styles.button}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 16,
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Clean.ctaBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Clean.ctaText,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
