import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

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
  backgroundColor,
  foregroundColor,
  icon = 'arrow-up-right',
}: ActionButtonProps) {
  const { theme } = useAppTheme();
  const background = backgroundColor ?? theme.colors.accent;
  const foreground = foregroundColor ?? theme.colors.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-disabled={disabled || busy}
      aria-busy={busy}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        (pressed || disabled || busy) && styles.dimmed,
      ]}
    >
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
      {busy ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <Feather name={icon} color={foreground} size={18} accessible={false} aria-hidden={true} />
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
