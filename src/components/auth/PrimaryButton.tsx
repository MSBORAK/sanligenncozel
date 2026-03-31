import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  label: string;
  onPress: () => void;
  colors?: [string, string];
  style?: ViewStyle;
  textStyle?: ViewStyle;
  disabled?: boolean;
};

const PrimaryButton: React.FC<Props> = ({ label, onPress, colors = ['#6A74F1', '#F4A9D9'], style, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 26,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.shadowWrap, style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={styles.pressable}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 999,
    shadowColor: '#BBA1F1',
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pressable: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  button: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default PrimaryButton;
