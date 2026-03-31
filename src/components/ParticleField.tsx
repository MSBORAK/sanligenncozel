import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

type Particle = {
  id: number;
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  opacity: number;
};

const PARTICLE_COUNT = 35;

/**
 * Renders subtle ambient particles over gradient backgrounds.
 */
export const ParticleField: React.FC = () => {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
        id,
        left: `${Math.random() * 100}%` as `${number}%`,
        top: `${Math.random() * 100}%` as `${number}%`,
        size: 1.5 + Math.random() * 1.5,
        opacity: 0.1 + Math.random() * 0.5,
      })),
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle) => (
        <View
          key={particle.id}
          style={[
            styles.dot,
            {
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              opacity: particle.opacity,
            },
          ]}
        />
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
