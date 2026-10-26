import Feather from '@expo/vector-icons/Feather';
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
import { LocationSearchForm } from './LocationSearchForm';
import { PROVIDER_PRESENTATIONS, type ProviderDefinition } from './providers';
import { ProviderSelector } from './ProviderSelector';
import { WeatherCard } from './WeatherCard';

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
  void Linking.openURL(url).catch(() => {
    Alert.alert('Unable to open this link', 'Please try again later.');
  });
}

export function WeatherScreen(props: WeatherScreenProps) {
  const insets = useSafeAreaInsets();
  const provider =
    props.providers.find(({ id }) => id === props.selectedProviderId) ?? PROVIDER_PRESENTATIONS[0];
  const { accent, ink, surface } = provider;
  const busy = props.isLoading || props.isRefreshing;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 22 },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          props.location ? (
            <RefreshControl
              refreshing={props.isRefreshing}
              onRefresh={busy ? undefined : props.onRefresh}
              tintColor={accent}
              colors={[accent]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={[styles.brandMark, { backgroundColor: accent }]}>
                <Feather name="sun" size={20} color="#FFFFFF" accessible={false} />
              </View>
              <Text accessibilityRole="header" style={[styles.wordmark, { color: ink }]}>
                strata
              </Text>
            </View>
            <View style={styles.headerLabel}>
              <Text style={styles.headerLabelText}>A WORLD</Text>
              <Text style={styles.headerLabelText}>OF WEATHER</Text>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={[styles.eyebrow, { color: accent }]}>MAKE ROOM FOR THE OUTSIDE</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: ink }]}>
              A little clarity.
            </Text>
            <Text style={[styles.title, styles.titleSecond, { color: ink }]}>
              Whatever the weather.
            </Text>
            <Text style={styles.subtitle}>Find your place. See what the sky has in mind.</Text>
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
            accent={accent}
            ink={ink}
          />

          <ProviderSelector
            providers={props.providers}
            selectedProviderId={props.selectedProviderId}
            onSelectProvider={props.onSelectProvider}
            ink={ink}
          />

          {props.weatherError ? (
            <View accessibilityLiveRegion="polite" style={styles.errorPanel}>
              <Feather name="cloud-off" size={22} color="#9A302B" accessible={false} />
              <View style={styles.errorContent}>
                <Text accessibilityRole="alert" style={styles.errorTitle}>
                  A pause in the forecast
                </Text>
                <Text style={styles.errorBody}>{props.weatherError}</Text>
                {props.weather ? (
                  <Text style={styles.errorBody}>
                    Showing the last available data for this source.
                  </Text>
                ) : (
                  <Text style={styles.errorBody}>Try again, or choose another source above.</Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry weather"
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  onPress={props.onRefresh}
                  style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.retryText}>Try again</Text>
                  <Feather name="arrow-right" size={16} color="#9A302B" accessible={false} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {props.isLoading ? (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.loading, { backgroundColor: surface }]}
            >
              <ActivityIndicator color={accent} size="large" />
              <Text style={[styles.loadingTitle, { color: ink }]}>
                Looking up, in {props.location?.name ?? 'your place'}.
              </Text>
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
            <View style={[styles.empty, { backgroundColor: surface }]}>
              <View accessible={false} style={styles.sunArtwork}>
                <View style={[styles.outerRing, { borderColor: accent }]} />
                <View style={[styles.innerRing, { borderColor: accent }]} />
                <View style={[styles.sunDisc, { backgroundColor: accent }]} />
                <View style={[styles.horizonLine, { backgroundColor: ink }]} />
                <View style={[styles.horizonMask, { backgroundColor: surface }]} />
                <View style={[styles.lowerHorizon, { backgroundColor: accent }]} />
              </View>
              <Text style={[styles.emptyTitle, { color: ink }]}>Every day starts somewhere.</Text>
              <Text style={styles.emptyDescription}>
                Search for a city to find your forecast. A new perspective is just a tap away.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try Tbilisi"
                onPress={() => props.onSelectLocation(TBILISI)}
                style={({ pressed }) => [
                  styles.quickSelect,
                  { borderColor: accent },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.quickSelectText, { color: accent }]}>Try Tbilisi</Text>
                <Feather name="arrow-up-right" size={16} color={accent} accessible={false} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.sourceNote}>
            <Text style={[styles.eyebrow, { color: accent }]}>{provider.eyebrow}</Text>
            <Text style={styles.sourceDescription}>{provider.description}</Text>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="link"
              onPress={() => openAttribution(props.weather?.attributionUrl ?? provider.url)}
              style={({ pressed }) => [styles.attribution, pressed && styles.pressed]}
            >
              <Text style={styles.attributionText}>
                {props.weather?.attribution ?? provider.attribution}
              </Text>
              <Feather name="external-link" size={11} color="#626E69" accessible={false} />
            </Pressable>
            <View style={styles.geocodingLinks}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Location search by Open-Meteo"
                onPress={() => openAttribution('https://open-meteo.com/en/docs/geocoding-api')}
                style={styles.footerLink}
              >
                <Text style={styles.geocodingText}>Location search: Open-Meteo</Text>
              </Pressable>
              <Text style={styles.geocodingText}>·</Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Location data by GeoNames"
                onPress={() => openAttribution('https://www.geonames.org/')}
                style={styles.footerLink}
              >
                <Text style={styles.geocodingText}>GeoNames</Text>
              </Pressable>
            </View>
            <Text style={styles.footerTagline}>A LITTLE MORE PERSPECTIVE.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const styles = StyleSheet.create({
  root: { backgroundColor: '#F5F2EB', flex: 1 },
  scroll: { alignItems: 'center', flexGrow: 1, paddingHorizontal: 24 },
  content: { gap: 25, maxWidth: 620, width: '100%' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  brandMark: {
    alignItems: 'center',
    borderRadius: 11,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  wordmark: { fontSize: 32, fontWeight: '800', letterSpacing: -1.6 },
  headerLabel: { gap: 3 },
  headerLabelText: {
    color: '#626E69',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.6,
    textAlign: 'right',
  },
  intro: { marginBottom: 4 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.7, lineHeight: 15 },
  title: { fontFamily: serif, fontSize: 38, letterSpacing: -1.4, lineHeight: 47, marginTop: 14 },
  titleSecond: { fontSize: 29, letterSpacing: -0.9, lineHeight: 38, marginTop: 0 },
  subtitle: { color: '#626E69', fontSize: 13, lineHeight: 21, marginTop: 11 },
  empty: {
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 19,
    paddingBottom: 27,
    paddingTop: 9,
  },
  sunArtwork: { height: 165, marginBottom: 10, overflow: 'hidden', width: 250 },
  outerRing: {
    borderRadius: 90,
    borderWidth: 1,
    height: 180,
    left: 35,
    opacity: 0.17,
    position: 'absolute',
    top: 8,
    width: 180,
  },
  innerRing: {
    borderRadius: 65,
    borderWidth: 1,
    height: 130,
    left: 60,
    opacity: 0.3,
    position: 'absolute',
    top: 33,
    width: 130,
  },
  sunDisc: { borderRadius: 42, height: 84, left: 83, position: 'absolute', top: 56, width: 84 },
  horizonLine: { height: 1, left: 18, opacity: 0.35, position: 'absolute', right: 18, top: 112 },
  horizonMask: { height: 55, left: 18, position: 'absolute', right: 18, top: 113 },
  lowerHorizon: { height: 1, left: 74, opacity: 0.45, position: 'absolute', right: 74, top: 124 },
  emptyTitle: {
    fontFamily: serif,
    fontSize: 23,
    letterSpacing: -0.5,
    lineHeight: 31,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#626E69',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 9,
    textAlign: 'center',
  },
  quickSelect: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 20,
  },
  quickSelectText: { fontSize: 12, fontWeight: '600' },
  loading: {
    alignItems: 'center',
    borderRadius: 24,
    gap: 15,
    minHeight: 230,
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: { fontFamily: serif, fontSize: 23, textAlign: 'center' },
  loadingDetail: { color: '#626E69', fontSize: 12, textAlign: 'center' },
  errorPanel: {
    alignItems: 'flex-start',
    backgroundColor: '#F9E8E2',
    borderColor: '#E4BFB0',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    padding: 18,
  },
  errorContent: { flex: 1, gap: 5 },
  errorTitle: { color: '#742C28', fontSize: 15, fontWeight: '600' },
  errorBody: { color: '#813E36', fontSize: 12, lineHeight: 19 },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
  },
  retryText: { color: '#9A302B', fontSize: 13, fontWeight: '600' },
  sourceNote: { alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  sourceDescription: { color: '#626E69', fontSize: 12, lineHeight: 20, textAlign: 'center' },
  footer: {
    alignItems: 'center',
    borderTopColor: '#DDDCD3',
    borderTopWidth: 1,
    gap: 2,
    paddingTop: 11,
  },
  attribution: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
  },
  attributionText: { color: '#626E69', fontSize: 11, lineHeight: 18, textAlign: 'center' },
  geocodingLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  footerLink: { justifyContent: 'center', minHeight: 44 },
  geocodingText: { color: '#626E69', fontSize: 10, lineHeight: 16 },
  footerTagline: {
    color: '#626E69',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 12,
  },
  pressed: { opacity: 0.65 },
});
