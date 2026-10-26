import Feather from '@expo/vector-icons/Feather';
import { memo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WeatherReport } from '../domain/weather';
import { IconButton } from '../shared/ui/IconButton';
import { colors, typography } from '../shared/ui/tokens';
import { CONDITION_LABELS, formatLocalTime, formatTemperature } from './formatting';
import { HourlyForecast } from './HourlyForecast';
import type { ProviderDefinition } from './providers';
import { WeatherScene } from './WeatherScene';

interface WeatherCardProps {
  readonly weather: WeatherReport;
  readonly provider: ProviderDefinition;
  readonly isRefreshing: boolean;
  readonly isStale: boolean;
  readonly onRefresh: () => void;
}

interface MetricProps {
  readonly icon: ComponentProps<typeof Feather>['name'];
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
}

function Metric({ icon, label, value, unit }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Feather name={icon} color={colors.muted} size={18} accessible={false} />
      <View style={styles.metricReading}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export const WeatherCard = memo(function WeatherCard({
  weather,
  provider,
  isRefreshing,
  isStale,
  onRefresh,
}: WeatherCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <WeatherScene
          accent={provider.accent}
          sceneColor={provider.sceneColor}
          condition={weather.condition}
          isDay={weather.isDay}
        />
        <View style={styles.heroTop}>
          <View style={styles.sourceBadge}>
            <View style={[styles.sourceDot, { backgroundColor: provider.accent }]} />
            <Text style={styles.sourceName}>{provider.name}</Text>
          </View>
          <IconButton
            label="Refresh weather"
            icon="rotate-cw"
            onPress={onRefresh}
            busy={isRefreshing}
            color="#E7EFDF"
            backgroundColor="#FFFFFF12"
          />
        </View>
        <View style={styles.reading}>
          <Text style={styles.micro}>CURRENT CONDITIONS</Text>
          <View style={styles.temperatureRow}>
            <Text
              accessibilityLabel={`${Math.round(weather.temperatureCelsius)} degrees Celsius`}
              style={styles.temperature}
            >
              {formatTemperature(weather.temperatureCelsius)}
            </Text>
            <Text style={[styles.unit, { color: provider.accent }]}>C</Text>
          </View>
          <Text style={styles.condition}>{CONDITION_LABELS[weather.condition]}</Text>
        </View>
        <View style={styles.heroBottom}>
          <View style={styles.dataTime}>
            <Feather name="clock" size={12} color={colors.nightMuted} accessible={false} />
            <Text style={styles.timestamp}>
              {isStale ? 'Last available' : 'Data time'} ·{' '}
              {formatLocalTime(weather.timestamp, weather.location.timezone)} local
            </Text>
          </View>
          <Text style={[styles.dayNight, { color: provider.accent }]}>
            {weather.isDay === null ? 'FORECAST' : weather.isDay ? 'DAYLIGHT' : 'AFTER DARK'}
          </Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric
          icon="wind"
          label="Wind · km/h"
          value={`${Math.round(weather.windSpeedKmh)}`}
          unit="km/h"
        />
        <Metric
          icon="droplet"
          label="Humidity"
          value={`${Math.round(weather.humidityPercent)}`}
          unit="%"
        />
        {weather.feelsLikeCelsius !== null ? (
          <Metric
            icon="thermometer"
            label="Feels like · °C"
            value={formatTemperature(weather.feelsLikeCelsius)}
          />
        ) : null}
      </View>
      <HourlyForecast
        hours={weather.hourly}
        timezone={weather.location.timezone}
        accent={provider.accent}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 23 },
  hero: { backgroundColor: colors.night, borderRadius: 30, overflow: 'hidden', padding: 24 },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  sourceBadge: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  sourceDot: { borderRadius: 3, height: 6, width: 6 },
  sourceName: { color: '#EBF2E6', fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.3 },
  micro: {
    color: colors.nightMuted,
    fontFamily: typography.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    lineHeight: 17,
  },
  reading: { paddingTop: 12 },
  temperatureRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -5,
    marginTop: 4,
  },
  temperature: {
    color: '#F7FAF0',
    fontSize: 110,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    letterSpacing: -9,
    lineHeight: 127,
  },
  unit: { fontFamily: typography.mono, fontSize: 20, marginLeft: 8, marginTop: 25 },
  condition: {
    color: '#F4F8EB',
    fontSize: 27,
    fontWeight: '400',
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 26,
    marginTop: 1,
  },
  heroBottom: {
    alignItems: 'center',
    borderTopColor: '#FFFFFF20',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingTop: 17,
  },
  dataTime: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timestamp: { color: colors.nightMuted, fontSize: 10, lineHeight: 17 },
  dayNight: { fontFamily: typography.mono, fontSize: 8, letterSpacing: 0.6 },
  metrics: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 23,
  },
  metric: { flex: 1, gap: 9, minWidth: 80 },
  metricReading: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  metricValue: {
    color: colors.ink,
    fontSize: 29,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    letterSpacing: -1.1,
  },
  metricUnit: { color: colors.muted, fontFamily: typography.mono, fontSize: 11 },
  metricLabel: { color: colors.muted, fontSize: 11, lineHeight: 17 },
});
