import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  total: number;
  active: number;
};

/**
 * Animated onboarding pagination indicator.
 */
export const DotIndicator: React.FC<Props> = ({ total, active }) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.dot, index === active && styles.dotActive]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
