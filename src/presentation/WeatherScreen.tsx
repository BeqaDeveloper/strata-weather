import Feather from '@expo/vector-icons/Feather';
import { memo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { WeatherLocation, WeatherReport } from '../domain/weather';
import { ActionButton } from '../shared/ui/ActionButton';
import { StatusNotice } from '../shared/ui/StatusNotice';
import { colors, typography } from '../shared/ui/tokens';
import { formatLocationDetails } from './formatting';
import { LocationSearchForm } from './LocationSearchForm';
import type { ProviderDefinition } from './providers';
import { ProviderSelector } from './ProviderSelector';
import { WeatherCard } from './WeatherCard';
import { WeatherScene } from './WeatherScene';

export interface WeatherScreenProps {
  readonly providers: readonly ProviderDefinition[];
  readonly selectedProviderId: string;
  readonly onSelectProvider: (id: string) => void;
  readonly query: string;
  readonly onChangeQuery: (value: string) => void;
  readonly onSearch: () => void;
  readonly validationError: string | null;
  readonly locations: readonly WeatherLocation[];
  readonly isSearching: boolean;
  readonly searchError: string | null;
  readonly onSelectLocation: (location: WeatherLocation) => void;
  readonly location: WeatherLocation | null;
  readonly weather: WeatherReport | undefined;
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly weatherError: string | null;
  readonly onRefresh: () => void;
}

const TBILISI: WeatherLocation = {
  id: '611717',
  name: 'Tbilisi',
  region: 'Tbilisi',
  country: 'Georgia',
  latitude: 41.6941,
  longitude: 44.8337,
  timezone: 'Asia/Tbilisi',
};

function openAttribution(url: string) {
  void Linking.openURL(url).catch(() =>
    Alert.alert('Unable to open this link', 'Please try again later.'),
  );
}

const SourceFooter = memo(function SourceFooter({
  provider,
  weather,
}: {
  readonly provider: ProviderDefinition;
  readonly weather: WeatherReport | undefined;
}) {
  return (
    <View style={styles.footer}>
      <View style={styles.sourceHeading}>
        <View style={[styles.sourceDot, { backgroundColor: provider.sceneColor }]} />
        <Text style={styles.sourceEyebrow}>{provider.eyebrow}</Text>
      </View>
      <Text style={styles.sourceDescription}>{provider.description}</Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => openAttribution(weather?.attributionUrl ?? provider.url)}
        style={styles.attribution}
      >
        <Text style={styles.attributionText}>{weather?.attribution ?? provider.attribution}</Text>
        <Feather name="arrow-up-right" size={13} color={colors.muted} accessible={false} />
      </Pressable>
      <View style={styles.footerBottom}>
        <Text style={styles.footerWordmark}>strata /</Text>
        <View style={styles.geocodingLinks}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Location search by Open-Meteo"
            onPress={() => openAttribution('https://open-meteo.com/en/docs/geocoding-api')}
            style={styles.footerLink}
          >
            <Text style={styles.geocodingText}>Open-Meteo</Text>
          </Pressable>
          <Text style={styles.geocodingText}>×</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Location data by GeoNames"
            onPress={() => openAttribution('https://www.geonames.org/')}
            style={styles.footerLink}
          >
            <Text style={styles.geocodingText}>GeoNames</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

export function WeatherScreen(props: WeatherScreenProps) {
  const insets = useSafeAreaInsets();
  const provider = props.providers.find(({ id }) => id === props.selectedProviderId);
  if (!provider)
    throw new Error(`Missing presentation for weather provider: ${props.selectedProviderId}`);
  const busy = props.isLoading || props.isRefreshing;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          props.location ? (
            <RefreshControl
              refreshing={props.isRefreshing}
              onRefresh={busy ? undefined : props.onRefresh}
              tintColor={colors.ink}
              colors={[colors.ink]}
            />
          ) : undefined
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.brandSymbol}>
                <View style={[styles.brandSun, { backgroundColor: provider.accent }]} />
                <View style={styles.brandHorizon} />
              </View>
              <Text accessibilityRole="header" style={styles.wordmark}>
                strata<Text style={styles.brandSlash}> /</Text>
              </Text>
            </View>
            <Text style={styles.edition}>{'WEATHER,\nIN PERSPECTIVE.'}</Text>
          </View>
          <View style={styles.locationHeader}>
            <View style={styles.locationLabel}>
              <Feather name="navigation" size={12} color={colors.muted} accessible={false} />
              <Text style={styles.micro}>
                {props.location ? 'YOUR CURRENT VIEW' : 'A NEW POINT OF VIEW'}
              </Text>
            </View>
            <Text accessibilityRole="header" style={styles.locationName}>
              {props.location?.name ?? 'Meet your\natmosphere.'}
            </Text>
            <Text style={styles.locationDetail}>
              {props.location
                ? formatLocationDetails(props.location)
                : 'Two forecasts. A clearer picture of your day.'}
            </Text>
          </View>
          <LocationSearchForm
            query={props.query}
            onChangeQuery={props.onChangeQuery}
            onSearch={props.onSearch}
            validationError={props.validationError}
            locations={props.locations}
            isSearching={props.isSearching}
            searchError={props.searchError}
            onSelectLocation={props.onSelectLocation}
            accent={provider.accent}
            ink={provider.ink}
          />
          <ProviderSelector
            providers={props.providers}
            selectedProviderId={props.selectedProviderId}
            onSelectProvider={props.onSelectProvider}
            ink={provider.ink}
          />
          {props.weatherError ? (
            <StatusNotice
              title="The forecast needs a moment."
              message={props.weatherError}
              detail={
                props.weather
                  ? 'Showing the last available data for this source.'
                  : 'Try again, or choose another source above.'
              }
              actionLabel="Try again"
              actionAccessibilityLabel="Retry weather"
              onAction={props.onRefresh}
              busy={busy}
            />
          ) : null}
          {props.isLoading ? (
            <View accessibilityLiveRegion="polite" style={styles.loading}>
              <ActivityIndicator color={provider.accent} size="large" />
              <Text style={styles.loadingTitle}>Reading the atmosphere.</Text>
              <Text style={styles.loadingDetail}>Getting the latest from {provider.name}…</Text>
            </View>
          ) : null}
          {props.weather ? (
            <WeatherCard
              weather={props.weather}
              provider={provider}
              isRefreshing={busy}
              isStale={props.weatherError !== null}
              onRefresh={props.onRefresh}
            />
          ) : null}
          {!props.location && !props.isLoading ? (
            <View style={styles.empty}>
              <WeatherScene
                accent={provider.accent}
                sceneColor={provider.sceneColor}
                condition="partly-cloudy"
                isDay
              />
              <Text style={[styles.emptyIndex, { color: provider.accent }]}>01 / LOOK UP</Text>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>{'A whole world.\nYour kind of weather.'}</Text>
                <Text style={styles.emptyDescription}>
                  Find a place above. We’ll take it from there.
                </Text>
                <View style={styles.quickSelect}>
                  <ActionButton
                    label="Explore Tbilisi"
                    accessibilityLabel="Try Tbilisi"
                    onPress={() => props.onSelectLocation(TBILISI)}
                    backgroundColor={provider.accent}
                    foregroundColor={colors.ink}
                  />
                </View>
              </View>
              <Text style={styles.emptyCoordinates}>41.69° N / 44.83° E</Text>
            </View>
          ) : null}
          <SourceFooter provider={provider} weather={props.weather} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.canvas, flex: 1 },
  scroll: { alignItems: 'center', flexGrow: 1, paddingHorizontal: 22 },
  content: { gap: 24, maxWidth: 620, width: '100%' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  brandSymbol: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 34,
  },
  brandSun: { borderRadius: 7, height: 14, marginTop: -3, width: 14 },
  brandHorizon: {
    backgroundColor: colors.ink,
    borderTopColor: colors.canvas,
    borderTopWidth: 1,
    bottom: 6,
    height: 8,
    left: 5,
    position: 'absolute',
    right: 5,
  },
  wordmark: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1.5 },
  brandSlash: { color: '#94A08B', fontWeight: '400' },
  edition: {
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: 8,
    letterSpacing: 1,
    lineHeight: 13,
    textAlign: 'right',
  },
  locationHeader: { gap: 8 },
  locationLabel: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  micro: { color: colors.muted, fontFamily: typography.mono, fontSize: 9, letterSpacing: 1.3 },
  locationName: {
    color: colors.ink,
    fontSize: 43,
    fontWeight: '500',
    letterSpacing: -2,
    lineHeight: 47,
  },
  locationDetail: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.night,
    borderRadius: 28,
    gap: 18,
    justifyContent: 'center',
    minHeight: 340,
    padding: 28,
  },
  loadingTitle: {
    color: '#F3F8E9',
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  loadingDetail: { color: colors.nightMuted, fontSize: 12, textAlign: 'center' },
  empty: {
    backgroundColor: colors.night,
    borderRadius: 30,
    minHeight: 390,
    overflow: 'hidden',
    padding: 24,
  },
  emptyIndex: { fontFamily: typography.mono, fontSize: 9, letterSpacing: 1.6 },
  emptyCopy: { gap: 12, marginTop: 155 },
  emptyTitle: {
    color: '#F3F8E9',
    fontSize: 29,
    fontWeight: '500',
    letterSpacing: -1.2,
    lineHeight: 34,
  },
  emptyDescription: { color: colors.nightMuted, fontSize: 12, lineHeight: 20 },
  quickSelect: { alignSelf: 'flex-start', marginTop: 9 },
  emptyCoordinates: {
    color: '#8FA48F',
    fontFamily: typography.mono,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 24,
  },
  footer: { gap: 9, paddingTop: 1 },
  sourceHeading: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  sourceDot: { borderRadius: 3, height: 5, width: 5 },
  sourceEyebrow: {
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  sourceDescription: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  attribution: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    minHeight: 44,
  },
  attributionText: { color: colors.muted, flexShrink: 1, fontSize: 10, lineHeight: 17 },
  footerBottom: {
    alignItems: 'center',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 7,
  },
  footerWordmark: { color: colors.muted, fontSize: 19, fontWeight: '700', letterSpacing: -0.8 },
  geocodingLinks: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  footerLink: { justifyContent: 'center', minHeight: 44 },
  geocodingText: { color: colors.muted, fontFamily: typography.mono, fontSize: 9 },
});
