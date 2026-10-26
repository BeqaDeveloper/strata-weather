import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from './tokens';

interface ActionButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly backgroundColor?: string;
  readonly foregroundColor?: string;
  readonly icon?: ComponentProps<typeof Feather>['name'];
}

export function ActionButton({
  label,
  onPress,
  accessibilityLabel = label,
  disabled = false,
  busy = false,
  backgroundColor = colors.ink,
  foregroundColor = '#FFFFFF',
  icon = 'arrow-up-right',
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        (pressed || disabled || busy) && styles.dimmed,
      ]}
    >
      <Text style={[styles.label, { color: foregroundColor }]}>{label}</Text>
      {busy ? (
        <ActivityIndicator size="small" color={foregroundColor} />
      ) : (
        <Feather name={icon} color={foregroundColor} size={18} accessible={false} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 28,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: { fontSize: 13, fontWeight: '700' },
  dimmed: { opacity: 0.65 },
});
