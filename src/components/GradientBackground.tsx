import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ParticleField } from './ParticleField';
import { useThemeMode } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
};

/**
 * Tam ekran "Kıvılcım / ateş" gradyanı — koyu köz → kızıl → turuncu.
 * ŞanlıGenç'in ateş temasıyla (Kıvılcım) ve şehrin sıcak kimliğiyle uyumlu.
 */
export const GradientBackground: React.FC<Props> = ({ children }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDark
            ? ['#160604', '#3D0E06', '#8A1C0A', '#D63C16']
            : ['#2A0A05', '#5A1408', '#B3260E', '#E8451A']
        }
        locations={[0, 0.42, 0.78, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.overlayFill}
      >
        <ParticleField />
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayFill: {
    flex: 1,
  },
});
