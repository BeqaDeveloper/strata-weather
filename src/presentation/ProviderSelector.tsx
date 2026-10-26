import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProviderDefinition } from './providers';

interface ProviderSelectorProps {
  readonly providers: readonly ProviderDefinition[];
  readonly selectedProviderId: string;
  readonly onSelectProvider: (id: string) => void;
  readonly ink: string;
}

export function ProviderSelector({
  providers,
  selectedProviderId,
  onSelectProvider,
  ink,
}: ProviderSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={[styles.label, { color: ink }]}>YOUR WEATHER SOURCE</Text>
        <Text style={styles.hint}>Two perspectives. One place.</Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Weather service"
        style={styles.options}
      >
        {providers.map((provider) => {
          const selected = selectedProviderId === provider.id;
          return (
            <Pressable
              accessibilityLabel={provider.name}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={provider.id}
              onPress={() => onSelectProvider(provider.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected ? provider.surface : '#F9F8F3',
                  borderColor: selected ? provider.accent : '#DDDCD3',
                },
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[styles.indicator, { borderColor: selected ? provider.accent : '#7D8580' }]}
              >
                {selected ? (
                  <View style={[styles.dot, { backgroundColor: provider.accent }]} />
                ) : null}
              </View>
              <Text style={[styles.name, { color: provider.ink }]}>{provider.name}</Text>
              {selected ? (
                <Feather name="check" color={provider.accent} size={16} accessible={false} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  hint: { color: '#626E69', fontSize: 11 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 54,
    minWidth: 135,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  indicator: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 15,
    justifyContent: 'center',
    width: 15,
  },
  dot: { borderRadius: 4, height: 7, width: 7 },
  name: { flex: 1, fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
