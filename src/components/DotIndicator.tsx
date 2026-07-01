import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = {
  total: number;
  active: number;
  accentColor?: string;
};

const Dot: React.FC<{ isActive: boolean; accentColor: string }> = ({ isActive, accentColor }) => {
  const widthAnim = useRef(new Animated.Value(isActive ? 24 : 6)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: isActive ? 24 : 6,
        useNativeDriver: false,
        damping: 16,
        stiffness: 200,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.35,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          opacity: opacityAnim,
          backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.5)',
        },
      ]}
    />
  );
};

export const DotIndicator: React.FC<Props> = ({ total, active, accentColor = '#FFFFFF' }) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} isActive={i === active} accentColor={accentColor} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
