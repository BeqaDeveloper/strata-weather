import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { WeatherCondition } from '../domain/weather';

type IconName = ComponentProps<typeof Feather>['name'];

const ICONS: Readonly<Record<WeatherCondition, IconName>> = {
  clear: 'sun',
  'partly-cloudy': 'cloud',
  cloudy: 'cloud',
  fog: 'align-center',
  rain: 'cloud-rain',
  snow: 'cloud-snow',
  thunderstorm: 'cloud-lightning',
  unknown: 'help-circle',
};

interface WeatherGlyphProps {
  readonly condition: WeatherCondition;
  readonly color: string;
  readonly size?: number;
  readonly isDay?: boolean | null;
}

export function WeatherGlyph({ condition, color, size = 28, isDay = null }: WeatherGlyphProps) {
  const clearIcon = isDay === null ? 'circle' : isDay ? 'sun' : 'moon';
  const name = condition === 'clear' ? clearIcon : ICONS[condition];
  return (
    <View
      accessible={false}
      aria-hidden={true}
      importantForAccessibility="no-hide-descendants"
      style={styles.container}
    >
      <Feather name={name} color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
