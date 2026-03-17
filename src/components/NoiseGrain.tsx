import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Svg, { Defs, Filter, FeTurbulence, Rect, Circle } from 'react-native-svg';

const DOT_SIZE = 2;
const DOT_SPACING = 6;
const DOT_OPACITIES = [0.02, 0.03, 0.04, 0.025, 0.035, 0.015]; // Hafif varyasyon

/**
 * %3-5 oranında hafif kumlama (noise) efekti.
 * iOS: FeTurbulence. Android: nokta grid fallback (filter desteği sınırlı).
 */
const NoiseGrain = () => {
  const { width, height } = useWindowDimensions();

  // Android fallback: grid of subtle dots (cross-platform güvenilir)
  if (Platform.OS === 'android') {
    const cols = Math.ceil(width / DOT_SPACING) + 1;
    const rows = Math.ceil(height / DOT_SPACING) + 1;
    const dots: { x: number; y: number; opacity: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          x: c * DOT_SPACING,
          y: r * DOT_SPACING,
          opacity: DOT_OPACITIES[(r + c) % DOT_OPACITIES.length],
        });
      }
    }
    return (
      <View style={[StyleSheet.absoluteFill, styles.wrapper]} pointerEvents="none">
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          {dots.map((d, i) => (
            <Circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={DOT_SIZE}
              fill="rgba(255,255,255,0.15)"
              opacity={d.opacity}
            />
          ))}
        </Svg>
      </View>
    );
  }

  // iOS: FeTurbulence ile premium noise
  return (
    <View style={[StyleSheet.absoluteFill, styles.wrapper]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Filter id="grain">
            <FeTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              seed="1"
              result="noise"
            />
          </Filter>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} filter="url(#grain)" opacity="0.04" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    opacity: 1,
  },
});

export default NoiseGrain;
