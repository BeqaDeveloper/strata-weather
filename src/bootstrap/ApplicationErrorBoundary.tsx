import { Component, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { writeLogSafely, type Logger } from '../shared/observability/logger';
import { useThemedStyles } from '../shared/theme/ThemeProvider';
import type { AppTheme } from '../shared/theme/themes';
import { ActionButton } from '../shared/ui/ActionButton';

interface BoundaryProps extends PropsWithChildren {
  readonly logger: Logger;
}

interface RecoveryProps extends BoundaryProps {
  readonly styles: ReturnType<typeof createStyles>;
}

class RecoveryBoundary extends Component<RecoveryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    writeLogSafely(this.props.logger, { event: 'app.render_failed', code: 'unexpected-render' });
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    const { styles } = this.props;
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>STRATA / SIGNAL INTERRUPTED</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Let’s reconnect.
        </Text>
        <Text accessibilityRole="alert" style={styles.body}>
          Something unexpected interrupted the screen. Your weather source is still yours to choose.
        </Text>
        <ActionButton
          label="Try again"
          accessibilityLabel="Restart weather screen"
          onPress={() => this.setState({ failed: false })}
        />
      </View>
    );
  }
}

export function ApplicationErrorBoundary(props: BoundaryProps) {
  const styles = useThemedStyles(createStyles);
  return <RecoveryBoundary {...props} styles={styles} />;
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: theme.colors.canvas,
      padding: 32,
      gap: 24,
    },
    eyebrow: { color: theme.colors.muted, fontSize: 11, letterSpacing: 2, fontWeight: '600' },
    title: { color: theme.colors.ink, fontSize: 42, fontWeight: '700', letterSpacing: -2 },
    body: { color: theme.colors.muted, fontSize: 17, lineHeight: 27 },
  });
