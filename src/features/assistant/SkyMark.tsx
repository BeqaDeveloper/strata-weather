import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface SkyMarkProps {
  readonly accent: string;
  readonly ink: string;
  readonly size?: number;
}

export const SkyMark = memo(function SkyMark({ accent, ink, size = 42 }: SkyMarkProps) {
  return (
    <View
      accessible={false}
      aria-hidden={true}
      importantForAccessibility="no-hide-descendants"
      style={[styles.orbit, { width: size, height: size, borderColor: accent }]}
    >
      <View
        style={[
          styles.core,
          {
            backgroundColor: accent,
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.24,
          },
        ]}
      >
        <View style={[styles.eye, { backgroundColor: ink, left: size * 0.17 }]} />
        <View style={[styles.eye, { backgroundColor: ink, right: size * 0.17 }]} />
        <View style={[styles.horizon, { backgroundColor: ink }]} />
      </View>
      <View style={[styles.spark, { backgroundColor: accent, borderColor: ink }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  orbit: { alignItems: 'center', justifyContent: 'center', borderRadius: 100, borderWidth: 1 },
  core: { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-7deg' }] },
  eye: { position: 'absolute', width: 3, height: 4, top: '35%', borderRadius: 2 },
  horizon: { position: 'absolute', bottom: '25%', width: '35%', height: 1.5, borderRadius: 2 },
  spark: {
    position: 'absolute',
    width: 9,
    height: 9,
    top: 0,
    right: 0,
    borderRadius: 3,
    borderWidth: 2,
    transform: [{ rotate: '20deg' }],
  },
});
