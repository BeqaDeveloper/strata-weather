import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Component, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createDependencies } from './src/application/createDependencies';
import { createQueryClient } from './src/application/queryClient';
import { useWeatherController } from './src/application/useWeatherController';
import { WeatherScreen } from './src/presentation/WeatherScreen';
import { PROVIDER_PRESENTATIONS } from './src/presentation/providers';

const dependencies = createDependencies();
const queryClient = createQueryClient();

function WeatherApplication() {
  const controller = useWeatherController(dependencies);
  return <WeatherScreen providers={PROVIDER_PRESENTATIONS} {...controller} />;
}

class ApplicationBoundary extends Component<PropsWithChildren, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.title}>A brief interruption.</Text>
          <Text style={styles.body}>Something went wrong. Let’s give it another try.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => this.setState({ hasError: false })}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ApplicationBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <WeatherApplication />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ApplicationBoundary>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: '#F5F2EB', gap: 20 },
  title: { color: '#172A2D', fontSize: 28, fontWeight: '600' },
  body: { color: '#435659', fontSize: 17, lineHeight: 26 },
  button: { minHeight: 48, padding: 16, backgroundColor: '#172A2D', borderRadius: 16 },
  buttonLabel: { color: '#FFFFFF', textAlign: 'center', fontWeight: '600' },
});
