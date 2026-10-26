import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useWeatherController } from './src/application/useWeatherController';
import { ApplicationErrorBoundary } from './src/bootstrap/ApplicationErrorBoundary';
import { createApplication } from './src/bootstrap/createApplication';
import { connectQueryLifecycle } from './src/platform/queryLifecycle';
import { WeatherScreen } from './src/presentation/WeatherScreen';
import {
  createConsoleLogSink,
  createLogger,
  silentLogger,
} from './src/shared/observability/logger';

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
  return <WeatherScreen providers={application.catalog.presentations} {...controller} />;
}

export default function App() {
  return (
    <ApplicationErrorBoundary logger={logger}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <WeatherApplication />
      </SafeAreaProvider>
    </ApplicationErrorBoundary>
  );
}
