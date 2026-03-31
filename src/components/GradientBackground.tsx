import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { ParticleField } from './ParticleField';
import { useThemeMode } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
};

const onboardingBackground = require('@/assets/images/_ (2).jpeg');

/**
 * Full-screen gradient with particles and ambient glow orbs.
 */
export const GradientBackground: React.FC<Props> = ({ children }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <View style={styles.container}>
      <ImageBackground source={onboardingBackground} resizeMode="cover" style={styles.imageFill}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(15, 8, 40, 0.46)', 'rgba(18, 10, 48, 0.6)', 'rgba(14, 10, 38, 0.72)']
              : ['rgba(255,255,255,0.1)', 'rgba(124,58,237,0.2)', 'rgba(15,23,42,0.26)']
          }
          start={{ x: 0.05, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={styles.overlayFill}
        >
          <ParticleField />
          {children}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageFill: {
    flex: 1,
  },
  overlayFill: {
    flex: 1,
  },
});
