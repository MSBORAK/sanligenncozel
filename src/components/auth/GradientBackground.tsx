import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  cityOverlay?: boolean;
};

const PARTICLES = [
  { top: '6%', left: '10%', size: 20, opacity: 0.2 },
  { top: '14%', right: '16%', size: 12, opacity: 0.16 },
  { top: '22%', left: '82%', size: 8, opacity: 0.2 },
  { top: '38%', left: '8%', size: 16, opacity: 0.13 },
  { top: '46%', right: '20%', size: 10, opacity: 0.18 },
  { top: '66%', left: '14%', size: 18, opacity: 0.1 },
  { top: '84%', right: '12%', size: 24, opacity: 0.1 },
] as const;

const GradientBackground: React.FC<Props> = ({ children, cityOverlay = false }) => {
  return (
    <LinearGradient colors={['#8968D7', '#6F86E8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.softGlowTop} />
        <View style={styles.softGlowBottom} />
        <View style={styles.cloudOne} />
        <View style={styles.cloudTwo} />
        {cityOverlay ? <View style={styles.citySilhouette} /> : null}
        {PARTICLES.map((particle, index) => (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            style={[
              styles.particle,
              {
                top: particle.top,
                left: 'left' in particle ? particle.left : undefined,
                right: 'right' in particle ? particle.right : undefined,
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                opacity: particle.opacity,
              },
            ]}
          />
        ))}
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  softGlowTop: {
    position: 'absolute',
    top: -50,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 179, 235, 0.2)',
  },
  softGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(174, 212, 255, 0.2)',
  },
  cloudOne: {
    position: 'absolute',
    left: -36,
    right: -20,
    bottom: 28,
    height: 104,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 232, 248, 0.22)',
  },
  cloudTwo: {
    position: 'absolute',
    left: 34,
    right: -34,
    bottom: -6,
    height: 90,
    borderRadius: 60,
    backgroundColor: 'rgba(191, 219, 255, 0.2)',
  },
  citySilhouette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 138,
    backgroundColor: 'rgba(25, 33, 74, 0.12)',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
});

export default GradientBackground;
