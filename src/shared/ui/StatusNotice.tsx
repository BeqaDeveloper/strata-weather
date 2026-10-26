import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from './ActionButton';
import { useAppTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/themes';

interface StatusNoticeProps {
  readonly title: string;
  readonly message: string;
  readonly detail?: string;
  readonly actionLabel?: string;
  readonly actionAccessibilityLabel?: string;
  readonly onAction?: () => void;
  readonly busy?: boolean;
}

export function StatusNotice({
  title,
  message,
  detail,
  actionLabel,
  actionAccessibilityLabel,
  onAction,
  busy,
}: StatusNoticeProps) {
  const {
    theme: { colors },
  } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View accessibilityLiveRegion="polite" style={styles.panel}>
      <Feather
        name="alert-circle"
        size={20}
        color={colors.error}
        accessible={false}
        aria-hidden={true}
      />
      <View style={styles.content}>
        <Text accessibilityRole="alert" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.message}>{detail}</Text> : null}
        {onAction && actionLabel ? (
          <View style={styles.action}>
            <ActionButton
              label={actionLabel}
              accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
              onPress={onAction}
              busy={busy}
              backgroundColor={colors.error}
              foregroundColor={colors.onError}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    panel: {
      alignItems: 'flex-start',
      backgroundColor: colors.errorSurface,
      borderColor: colors.error,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 18,
    },
    content: { flex: 1, gap: 8 },
    title: { color: colors.error, fontSize: 15, fontWeight: '700' },
    message: { color: colors.error, fontSize: 13, lineHeight: 20 },
    action: { alignSelf: 'flex-start', marginTop: 3 },
  });
