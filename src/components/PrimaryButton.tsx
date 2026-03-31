import React from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'onboarding';
};

/**
 * Main call-to-action gradient pill button with press animation.
 */
export const PrimaryButton: React.FC<Props> = ({ label, onPress, style, variant = 'default' }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const isOnboarding = variant === 'onboarding';

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
      style={[styles.wrapper, isOnboarding && styles.wrapperOnboarding, style, { transform: [{ scale }] }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => animateScale(0.96)}
        onPressOut={() => animateScale(1)}
        style={[styles.pressable, isOnboarding && styles.pressableOnboarding]}
      >
        <LinearGradient
          colors={isOnboarding ? ['#8B5CF6', '#3B82F6'] : [colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, isOnboarding && styles.buttonOnboarding]}
        >
          <Text style={[styles.label, isOnboarding && styles.labelOnboarding]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 50,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  wrapperOnboarding: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 14,
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressable: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  pressableOnboarding: {
    borderRadius: 14,
  },
  button: {
    height: 54,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOnboarding: {
    height: 46,
    borderRadius: 14,
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  labelOnboarding: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.1,
  },
});
