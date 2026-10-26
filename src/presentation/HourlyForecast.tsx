import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import type { HourlyWeather } from '../domain/weather';
import { colors, typography } from '../shared/ui/tokens';
import { createForecastPoints } from './forecastGeometry';
import { CONDITION_LABELS, formatLocalTime, formatTemperature } from './formatting';
import { WeatherGlyph } from './WeatherGlyph';

interface HourlyForecastProps {
  readonly hours: readonly HourlyWeather[];
  readonly timezone: string;
  readonly accent: string;
}

export const HourlyForecast = memo(function HourlyForecast({
  hours,
  timezone,
  accent,
}: HourlyForecastProps) {
  if (hours.length === 0) return null;
  const points = createForecastPoints(hours);
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          The hours ahead
        </Text>
        <Text style={styles.micro}>LOCAL TIME / °C</Text>
      </View>
      {points.length > 1 ? (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={styles.trace}
        >
          <Svg width="100%" height="62" viewBox="0 0 600 72" preserveAspectRatio="none">
            <Line x1="12" y1="60" x2="588" y2="60" stroke={colors.line} strokeDasharray="3 5" />
            <Polyline
              points={points.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={colors.ink}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {points.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="5"
                fill={accent}
                stroke={colors.ink}
                strokeWidth="1.5"
              />
            ))}
          </Svg>
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hours}
      >
        {hours.map((hour) => (
          <View
            accessible
            accessibilityLabel={`${formatLocalTime(hour.timestamp, timezone)}, ${Math.round(hour.temperatureCelsius)} degrees Celsius, ${CONDITION_LABELS[hour.condition]}`}
            key={hour.timestamp}
            style={styles.hour}
          >
            <Text style={styles.time}>{formatLocalTime(hour.timestamp, timezone)}</Text>
            <WeatherGlyph
              condition={hour.condition}
              color={colors.ink}
              isDay={hour.isDay}
              size={23}
            />
            <Text style={styles.temperature}>{formatTemperature(hour.temperatureCelsius)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 19,
    paddingBottom: 26,
    paddingTop: 8,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    justifyContent: 'space-between',
  },
  title: { color: colors.ink, fontSize: 21, fontWeight: '600', letterSpacing: -0.7 },
  micro: { color: colors.muted, fontFamily: typography.mono, fontSize: 9, letterSpacing: 0.5 },
  trace: { marginTop: 4 },
  hours: { flexGrow: 1, gap: 4, justifyContent: 'space-between' },
  hour: { alignItems: 'center', gap: 12, minWidth: 60, paddingHorizontal: 5 },
  time: { color: colors.muted, fontFamily: typography.mono, fontSize: 10 },
  temperature: { color: colors.ink, fontSize: 20, fontWeight: '600', letterSpacing: -0.8 },
});
