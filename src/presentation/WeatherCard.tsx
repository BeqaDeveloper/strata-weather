import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { WeatherReport } from '../domain/weather';
import {
  CONDITION_LABELS,
  formatLocalTime,
  formatLocationDetails,
  formatTemperature,
} from './formatting';
import type { ProviderDefinition } from './providers';
import { WeatherGlyph } from './WeatherGlyph';

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
  readonly ink: string;
  readonly accent: string;
}

function Metric({ icon, label, value, ink, accent }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Feather name={icon} color={accent} size={20} accessible={false} />
      <Text style={[styles.metricValue, { color: ink }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function WeatherCard({
  weather,
  provider,
  isRefreshing,
  isStale,
  onRefresh,
}: WeatherCardProps) {
  const { accent, ink, surface } = provider;
  return (
    <View style={styles.container}>
      <View style={[styles.hero, { backgroundColor: surface }]}>
        <View style={styles.heroHeading}>
          <View style={styles.sourceBadge}>
            <View style={[styles.sourceDot, { backgroundColor: accent }]} />
            <Text style={[styles.sourceName, { color: ink }]}>{provider.name}</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh weather"
            accessibilityRole="button"
            accessibilityState={{ disabled: isRefreshing, busy: isRefreshing }}
            disabled={isRefreshing}
            onPress={onRefresh}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          >
            {isRefreshing ? (
              <ActivityIndicator color={ink} size="small" />
            ) : (
              <Feather name="refresh-cw" size={18} color={ink} accessible={false} />
            )}
          </Pressable>
        </View>
        <Text accessibilityRole="header" style={[styles.city, { color: ink }]}>
          {weather.location.name}
        </Text>
        <Text style={styles.locationDetails}>{formatLocationDetails(weather.location)}</Text>
        <View style={styles.temperatureRow}>
          <View style={styles.temperatureGroup}>
            <Text
              accessibilityLabel={`${Math.round(weather.temperatureCelsius)} degrees Celsius`}
              style={[styles.temperature, { color: ink }]}
            >
              {formatTemperature(weather.temperatureCelsius)}
            </Text>
            <Text style={[styles.unit, { color: ink }]}>C</Text>
          </View>
          <View style={styles.heroGlyph}>
            <View style={[styles.glyphOrbit, { borderColor: accent }]} />
            <WeatherGlyph
              condition={weather.condition}
              color={accent}
              isDay={weather.isDay}
              size={70}
            />
          </View>
        </View>
        <Text style={[styles.condition, { color: ink }]}>
          {CONDITION_LABELS[weather.condition]}
        </Text>
        <View style={styles.timestampRow}>
          <Feather name="clock" size={12} color="#5F6964" accessible={false} />
          <Text style={styles.timestamp}>
            {isStale ? 'Last available' : 'Data time'} ·{' '}
            {formatLocalTime(weather.timestamp, weather.location.timezone)} local
          </Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric
          icon="wind"
          label="Wind · km/h"
          value={`${Math.round(weather.windSpeedKmh)}`}
          ink={ink}
          accent={accent}
        />
        <Metric
          icon="droplet"
          label="Humidity"
          value={`${Math.round(weather.humidityPercent)}%`}
          ink={ink}
          accent={accent}
        />
        {weather.feelsLikeCelsius !== null ? (
          <Metric
            icon="thermometer"
            label="Feels like · °C"
            value={formatTemperature(weather.feelsLikeCelsius)}
            ink={ink}
            accent={accent}
          />
        ) : null}
      </View>

      {weather.hourly.length > 0 ? (
        <View style={styles.forecast}>
          <View style={styles.forecastHeading}>
            <Text accessibilityRole="header" style={[styles.forecastTitle, { color: ink }]}>
              The hours ahead
            </Text>
            <Text style={styles.forecastUnit}>°C · LOCAL TIME</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hours}
          >
            {weather.hourly.map((hour) => (
              <View
                accessible
                accessibilityLabel={`${formatLocalTime(hour.timestamp, weather.location.timezone)}, ${Math.round(hour.temperatureCelsius)} degrees Celsius, ${CONDITION_LABELS[hour.condition]}`}
                key={hour.timestamp}
                style={styles.hour}
              >
                <Text style={styles.hourTime}>
                  {formatLocalTime(hour.timestamp, weather.location.timezone)}
                </Text>
                <WeatherGlyph condition={hour.condition} color={accent} isDay={hour.isDay} />
                <Text style={[styles.hourTemperature, { color: ink }]}>
                  {formatTemperature(hour.temperatureCelsius)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const styles = StyleSheet.create({
  container: { gap: 16 },
  hero: { borderRadius: 26, overflow: 'hidden', padding: 24 },
  heroHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sourceBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF99',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  sourceDot: { borderRadius: 3, height: 6, width: 6 },
  sourceName: { fontSize: 11, fontWeight: '600' },
  refreshButton: {
    alignItems: 'center',
    borderColor: '#FFFFFFAA',
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  city: { fontFamily: serif, fontSize: 34, letterSpacing: -0.8 },
  locationDetails: { color: '#5F6964', fontSize: 13, lineHeight: 21, marginTop: 3 },
  temperatureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  temperatureGroup: { alignItems: 'flex-start', flexDirection: 'row' },
  temperature: {
    fontSize: 96,
    fontWeight: '300',
    letterSpacing: -7,
    lineHeight: 114,
    fontVariant: ['tabular-nums'],
  },
  unit: { fontSize: 19, fontWeight: '500', marginLeft: 5, marginTop: 25 },
  heroGlyph: {
    alignItems: 'center',
    height: 104,
    justifyContent: 'center',
    marginRight: 3,
    width: 104,
  },
  glyphOrbit: {
    borderRadius: 52,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 104,
    opacity: 0.28,
    position: 'absolute',
    width: 104,
  },
  condition: { fontFamily: serif, fontSize: 25, letterSpacing: -0.3, marginBottom: 10 },
  timestampRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timestamp: { color: '#5F6964', fontSize: 11, lineHeight: 17 },
  metrics: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E1D9',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 20,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    minWidth: 90,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  metricValue: { fontSize: 25, fontWeight: '500', fontVariant: ['tabular-nums'] },
  metricLabel: { color: '#626E69', fontSize: 11, textAlign: 'center' },
  forecast: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E1D9',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 22,
  },
  forecastHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 23,
    paddingHorizontal: 20,
  },
  forecastTitle: { fontFamily: serif, fontSize: 22, letterSpacing: -0.3 },
  forecastUnit: { color: '#626E69', fontSize: 9, fontWeight: '600', letterSpacing: 1.2 },
  hours: { gap: 5, paddingHorizontal: 12 },
  hour: { alignItems: 'center', gap: 16, minWidth: 73, paddingHorizontal: 6 },
  hourTime: { color: '#626E69', fontSize: 11 },
  hourTemperature: { fontSize: 20, fontWeight: '500' },
  pressed: { opacity: 0.65 },
});
