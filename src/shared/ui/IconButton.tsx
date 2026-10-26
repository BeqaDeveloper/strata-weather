import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

interface IconButtonProps {
  readonly label: string;
  readonly icon: ComponentProps<typeof Feather>['name'];
  readonly onPress: () => void;
  readonly busy?: boolean;
  readonly color?: string;
  readonly backgroundColor?: string;
}

export function IconButton({
  label,
  icon,
  onPress,
  busy = false,
  color,
  backgroundColor,
}: IconButtonProps) {
  const { theme } = useAppTheme();
  const foreground = color ?? theme.colors.ink;
  const background = backgroundColor ?? theme.colors.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={busy}
      aria-busy={busy}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <Feather name={icon} color={foreground} size={19} accessible={false} aria-hidden={true} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 24,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  pressed: { opacity: 0.6 },
});
