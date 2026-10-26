import Feather from '@expo/vector-icons/Feather';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { typography } from '../shared/ui/tokens';
import { useAppTheme, useThemedStyles } from '../shared/theme/ThemeProvider';
import type { AppTheme } from '../shared/theme/themes';
import type { ProviderDefinition } from './providers';

interface ProviderSelectorProps {
  readonly providers: readonly ProviderDefinition[];
  readonly selectedProviderId: string;
  readonly onSelectProvider: (id: string) => void;
}

export const ProviderSelector = memo(function ProviderSelector({
  providers,
  selectedProviderId,
  onSelectProvider,
}: ProviderSelectorProps) {
  const {
    theme: { colors },
  } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.label}>FORECAST SOURCE</Text>
        <Feather
          name="layers"
          size={13}
          color={colors.muted}
          accessible={false}
          aria-hidden={true}
        />
      </View>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Weather service"
        style={styles.options}
      >
        {providers.map((provider, index) => {
          const selected = selectedProviderId === provider.id;
          return (
            <Pressable
              accessibilityLabel={provider.name}
              accessibilityRole="radio"
              aria-checked={selected}
              key={provider.id}
              onPress={() => onSelectProvider(provider.id)}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: selected ? provider.accent : 'transparent' },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.number, { color: selected ? provider.ink : colors.muted }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.name, { color: selected ? provider.ink : colors.muted }]}>
                {provider.name}
              </Text>
              {selected ? (
                <Feather
                  name="check"
                  color={provider.ink}
                  size={15}
                  accessible={false}
                  aria-hidden={true}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    container: { gap: 10 },
    heading: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    label: { color: colors.muted, fontFamily: typography.mono, fontSize: 9, letterSpacing: 1.3 },
    options: {
      backgroundColor: colors.segmented,
      borderRadius: 27,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      padding: 4,
    },
    option: {
      alignItems: 'center',
      borderRadius: 23,
      flex: 1,
      flexDirection: 'row',
      gap: 7,
      minHeight: 46,
      minWidth: 125,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    number: { fontFamily: typography.mono, fontSize: 9 },
    name: { flex: 1, fontSize: 12, fontWeight: '700' },
    pressed: { opacity: 0.7 },
  });
