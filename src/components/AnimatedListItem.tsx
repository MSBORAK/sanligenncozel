import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Liste öğelerine fade-in animasyonu ekler.
 * index verilirse sıralı gecikme uygular (0: 0ms, 1: 50ms, 2: 100ms...).
 */
const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index = 0,
  delay = 50,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const startDelay = index * delay;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: startDelay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: startDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedListItem;
