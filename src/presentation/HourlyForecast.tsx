import { memo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import type { HourlyWeather } from '../domain/weather';
import { useAppTheme, useThemedStyles } from '../shared/theme/ThemeProvider';
import type { AppTheme } from '../shared/theme/themes';
import { typography } from '../shared/ui/tokens';
import { createForecastTimeline } from './forecastGeometry';
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
  const {
    theme: { colors },
  } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [viewportWidth, setViewportWidth] = useState(360);
  if (hours.length === 0) return null;
  const timeline = createForecastTimeline(hours, viewportWidth);
  return (
    <View
      style={styles.section}
      onLayout={({ nativeEvent }) => setViewportWidth(Math.round(nativeEvent.layout.width))}
    >
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          The hours ahead
        </Text>
        <Text style={styles.micro}>LOCAL TIME / °C</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel="Hourly forecast timeline"
      >
        <View style={{ width: timeline.width }}>
          {timeline.points.length > 1 ? (
            <View
              testID="forecast-trace"
              accessible={false}
              aria-hidden={true}
              importantForAccessibility="no-hide-descendants"
              style={styles.trace}
            >
              <Svg
                width={timeline.width}
                height="62"
                viewBox={`0 0 ${timeline.width} 72`}
                preserveAspectRatio="none"
              >
                <Line
                  x1="32"
                  y1="60"
                  x2={timeline.width - 32}
                  y2="60"
                  stroke={colors.line}
                  strokeDasharray="3 5"
                />
                <Polyline
                  points={timeline.points.map((point) => `${point.x},${point.y}`).join(' ')}
                  fill="none"
                  stroke={colors.ink}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                {timeline.points.map((point, index) => (
                  <Circle
                    key={hours[index]?.timestamp ?? index}
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
          <View style={styles.hours}>
            {hours.map((hour, index) => (
              <View
                accessible
                accessibilityLabel={`${formatLocalTime(hour.timestamp, timezone)}, ${Math.round(hour.temperatureCelsius)} degrees Celsius, ${CONDITION_LABELS[hour.condition]}`}
                key={hour.timestamp}
                style={[
                  styles.hour,
                  {
                    marginLeft:
                      index === 0
                        ? (timeline.positions[index] ?? 32) - 32
                        : (timeline.positions[index] ?? 0) -
                          (timeline.positions[index - 1] ?? 0) -
                          64,
                  },
                ]}
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
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
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
    trace: { marginTop: 4, marginBottom: 19 },
    hours: { flexDirection: 'row', alignItems: 'flex-start' },
    hour: { alignItems: 'center', gap: 12, width: 64, paddingHorizontal: 2 },
    time: { color: colors.muted, fontFamily: typography.mono, fontSize: 10, textAlign: 'center' },
    temperature: { color: colors.ink, fontSize: 20, fontWeight: '600', letterSpacing: -0.8 },
  });
