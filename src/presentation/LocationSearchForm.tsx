import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { WeatherLocation } from '../domain/weather';
import { IconButton } from '../shared/ui/IconButton';
import { typography } from '../shared/ui/tokens';
import { useAppTheme, useThemedStyles } from '../shared/theme/ThemeProvider';
import type { AppTheme } from '../shared/theme/themes';
import { formatLocationDetails } from './formatting';

interface LocationSearchFormProps {
  readonly query: string;
  readonly onChangeQuery: (value: string) => void;
  readonly onSearch: () => void;
  readonly validationError: string | null;
  readonly locations: readonly WeatherLocation[];
  readonly isSearching: boolean;
  readonly searchError: string | null;
  readonly onSelectLocation: (location: WeatherLocation) => void;
}

export function LocationSearchForm({
  query,
  onChangeQuery,
  onSearch,
  validationError,
  locations,
  isSearching,
  searchError,
  onSelectLocation,
}: LocationSearchFormProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const error = validationError ?? searchError;
  return (
    <View style={styles.section}>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <Feather
          name="search"
          size={18}
          color={colors.muted}
          accessible={false}
          aria-hidden={true}
        />
        <TextInput
          accessibilityLabel="Location"
          accessibilityHint="Enter a city or postal code, then search to choose a location."
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={100}
          onChangeText={onChangeQuery}
          onSubmitEditing={onSearch}
          placeholder="Find a city or postal code"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          keyboardAppearance={theme.dark ? 'dark' : 'light'}
          selectionColor={colors.ink}
          style={[styles.input, { color: colors.ink }]}
          value={query}
        />
        <IconButton
          label="Search location"
          icon="arrow-right"
          onPress={onSearch}
          busy={isSearching}
          backgroundColor={colors.accent}
          color={colors.onAccent}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {isSearching ? (
        <Text accessibilityLiveRegion="polite" style={styles.helper}>
          Finding your place…
        </Text>
      ) : null}
      {locations.length > 0 ? (
        <View style={styles.results}>
          <Text style={styles.resultsLabel}>CHOOSE A LOCATION</Text>
          {locations.map((candidate) => (
            <Pressable
              accessibilityLabel={`${candidate.name}, ${formatLocationDetails(candidate)}`}
              accessibilityRole="button"
              key={candidate.id}
              onPress={() => onSelectLocation(candidate)}
              style={({ pressed }) => [styles.result, pressed && styles.pressed]}
            >
              <View style={styles.resultText}>
                <Text style={[styles.resultName, { color: colors.ink }]}>{candidate.name}</Text>
                <Text style={styles.helper}>{formatLocationDetails(candidate)}</Text>
              </View>
              <Feather
                name="arrow-up-right"
                size={20}
                color={colors.ink}
                accessible={false}
                aria-hidden={true}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    section: { gap: 10 },
    field: {
      alignItems: 'center',
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 28,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 60,
      padding: 6,
      paddingLeft: 16,
    },
    fieldError: { borderColor: colors.error },
    input: { flex: 1, fontSize: 14, minHeight: 46, minWidth: 0, paddingVertical: 8 },
    pressed: { opacity: 0.7 },
    error: { color: colors.error, fontSize: 13, lineHeight: 20 },
    helper: { color: colors.muted, fontSize: 13, lineHeight: 20 },
    results: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      paddingTop: 15,
    },
    resultsLabel: {
      color: colors.muted,
      fontFamily: typography.mono,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.5,
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
    result: {
      alignItems: 'center',
      borderTopColor: colors.line,
      borderTopWidth: 1,
      flexDirection: 'row',
      gap: 12,
      minHeight: 66,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    resultText: { flex: 1, gap: 2 },
    resultName: { fontSize: 16, fontWeight: '600' },
  });
