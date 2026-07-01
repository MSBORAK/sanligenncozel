import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  baseOpacity: number;
  delay: number;
  duration: number;
};

const PARTICLE_COUNT = 38;

const TwinkleParticle: React.FC<{ particle: Particle }> = ({ particle }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: particle.duration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: particle.duration * 0.5,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [particle.baseOpacity * 0.2, particle.baseOpacity],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left: `${particle.left}%` as any,
          top: `${particle.top}%` as any,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          opacity,
        },
      ]}
    />
  );
};

export const ParticleField: React.FC = () => {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
        id,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1.4 + Math.random() * 1.8,
        baseOpacity: 0.25 + Math.random() * 0.55,
        delay: Math.random() * 3000,
        duration: 2200 + Math.random() * 2800,
      })),
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map(p => (
        <TwinkleParticle key={p.id} particle={p} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
});
