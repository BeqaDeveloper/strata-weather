import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from './ActionButton';
import { colors } from './tokens';

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
  return (
    <View accessibilityLiveRegion="polite" style={styles.panel}>
      <Feather name="alert-circle" size={20} color={colors.error} accessible={false} />
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
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'flex-start',
    backgroundColor: colors.errorSurface,
    borderColor: '#E8C9BD',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 18,
  },
  content: { flex: 1, gap: 8 },
  title: { color: colors.error, fontSize: 15, fontWeight: '700' },
  message: { color: '#7B4239', fontSize: 13, lineHeight: 20 },
  action: { alignSelf: 'flex-start', marginTop: 3 },
});
