import { Component, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { writeLogSafely, type Logger } from '../shared/observability/logger';

interface BoundaryProps extends PropsWithChildren {
  readonly logger: Logger;
}

export class ApplicationErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    writeLogSafely(this.props.logger, { event: 'app.render_failed', code: 'unexpected-render' });
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>STRATA / SIGNAL INTERRUPTED</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Let’s reconnect.
        </Text>
        <Text accessibilityRole="alert" style={styles.body}>
          Something unexpected interrupted the screen. Your weather source is still yours to choose.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restart weather screen"
          onPress={() => this.setState({ failed: false })}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F3F4EE',
    padding: 32,
    gap: 24,
  },
  eyebrow: { color: '#46564D', fontSize: 11, letterSpacing: 2, fontWeight: '600' },
  title: { color: '#121A18', fontSize: 42, fontWeight: '700', letterSpacing: -2 },
  body: { color: '#46564D', fontSize: 17, lineHeight: 27 },
  button: { backgroundColor: '#121A18', padding: 18, borderRadius: 18, minHeight: 54 },
  buttonLabel: { color: '#D8F36A', textAlign: 'center', fontSize: 16, fontWeight: '700' },
});
