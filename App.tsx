import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useWeatherController } from './src/application/useWeatherController';
import { ApplicationErrorBoundary } from './src/bootstrap/ApplicationErrorBoundary';
import { createApplication } from './src/bootstrap/createApplication';
import { connectQueryLifecycle } from './src/platform/queryLifecycle';
import { WeatherAssistantWidget } from './src/features/assistant/WeatherAssistantWidget';
import { WeatherScreen } from './src/presentation/WeatherScreen';
import {
  createConsoleLogSink,
  createLogger,
  silentLogger,
} from './src/shared/observability/logger';
import { ThemeProvider, useAppTheme } from './src/shared/theme/ThemeProvider';

const logger = __DEV__ ? createLogger(createConsoleLogSink()) : silentLogger;

function WeatherApplication() {
  const [application] = useState(() => createApplication(logger));
  useEffect(() => connectQueryLifecycle(), []);
  return (
    <QueryClientProvider client={application.queryClient}>
      <WeatherExperience application={application} />
    </QueryClientProvider>
  );
}

function WeatherExperience({
  application,
}: {
  readonly application: ReturnType<typeof createApplication>;
}) {
  const controller = useWeatherController(application.weather);
  return (
    <View style={styles.experience}>
      <WeatherScreen providers={application.catalog.presentations} {...controller} />
      <WeatherAssistantWidget />
    </View>
  );
}

function AppearanceStatusBar() {
  const { theme } = useAppTheme();
  return <StatusBar style={theme.dark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ApplicationErrorBoundary logger={logger}>
        <SafeAreaProvider>
          <AppearanceStatusBar />
          <WeatherApplication />
        </SafeAreaProvider>
      </ApplicationErrorBoundary>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ experience: { flex: 1 } });
