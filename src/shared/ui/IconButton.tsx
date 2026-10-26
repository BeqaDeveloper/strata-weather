import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { colors } from './tokens';

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
  color = colors.ink,
  backgroundColor = colors.paper,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor }, pressed && styles.pressed]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Feather name={icon} color={color} size={19} accessible={false} />
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
