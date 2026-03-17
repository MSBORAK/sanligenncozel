/**
 * Urfa Pattern Overlay
 * Göbeklitepe'den ilham alan soyut motifler - arka planda çok silik watermark
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

const MOTIF_OPACITY = 0.09;

const UrfaPatternOverlay = () => {
  const { width, height } = useWindowDimensions();

  // Soyutlaştırılmış Göbeklitepe T-direk, spiral, daire motifleri
  const motifs = [
    // Sol üst - T direk silüeti
    { x: width * 0.08, y: height * 0.15, scale: 0.4, paths: [
      'M0 0h24v8a4 4 0 01-4 4H4a4 4 0 01-4-4V0',
      'M8 12v24a4 4 0 004 4h8a4 4 0 004-4V12'
    ]},
    // Sağ üst - konsantrik daireler (Göbeklitepe spiral)
    { x: width * 0.82, y: height * 0.12, scale: 0.35, circles: [12, 8, 4] },
    // Orta sol - minimal T
    { x: width * 0.12, y: height * 0.45, scale: 0.25, paths: [
      'M0 0h16v4a2 2 0 01-2 2H2a2 2 0 01-2-2V0',
      'M4 8v16a2 2 0 002 2h4a2 2 0 002-2V8'
    ]},
    // Orta sağ - daire grubu
    { x: width * 0.78, y: height * 0.52, scale: 0.3, circles: [10, 6] },
    // Alt - yarım daire / spiral benzeri
    { x: width * 0.5, y: height * 0.78, scale: 0.5, paths: [
      'M0 20 A20 20 0 0 1 40 20'
    ]},
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.container]} pointerEvents="none">
      <Svg width={width} height={height}>
        <G opacity={MOTIF_OPACITY} stroke="rgba(243,213,141,0.85)" strokeWidth={1.4} fill="none">
          {motifs.map((m, i) => (
            <G key={i} transform={`translate(${m.x}, ${m.y}) scale(${m.scale})`}>
              {m.paths?.map((d, j) => <Path key={j} d={d} />)}
              {m.circles?.map((r, j) => <Circle key={j} cx={0} cy={0} r={r} />)}
            </G>
          ))}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    opacity: 1,
  },
});

export default UrfaPatternOverlay;
