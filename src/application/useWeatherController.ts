import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { toWeatherError } from '../domain/errors';
import { validateLocationQuery } from '../domain/validation';
import type { WeatherLocation } from '../domain/weather';
import type { WeatherDependencies } from './ports';
import { weatherQueryKeys } from './queryKeys';
import { QUERY_POLICY, shouldRetryRequest } from './queryPolicy';

const EMPTY_LOCATIONS: readonly WeatherLocation[] = Object.freeze([]);

export function useWeatherController(dependencies: WeatherDependencies) {
  const [selectedProviderId, setSelectedProviderId] = useState(dependencies.initialProviderId);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [location, setLocation] = useState<WeatherLocation | null>(null);
  const provider = dependencies.providers.get(selectedProviderId);

  if (!provider) throw new Error(`Weather provider is not registered: ${selectedProviderId}`);

  const search = useQuery({
    queryKey: weatherQueryKeys.locations(submittedQuery),
    queryFn: ({ signal }) => dependencies.locationSearch.search(submittedQuery ?? '', signal),
    enabled: submittedQuery !== null,
    staleTime: QUERY_POLICY.locationFreshnessMs,
    retry: shouldRetryRequest,
    meta: { operation: 'location-search' },
  });

  const forecast = useQuery({
    queryKey: weatherQueryKeys.forecast(provider.id, location),
    queryFn: ({ signal }) => {
      if (!location) throw new Error('Choose a location before requesting weather.');
      return provider.getWeather(location, signal);
    },
    enabled: location !== null,
    staleTime: QUERY_POLICY.forecastFreshnessMs,
    retry: shouldRetryRequest,
    meta: { operation: 'weather' },
  });

  const onChangeQuery = useCallback((value: string) => {
    setQuery(value);
    setValidationError(null);
    setSubmittedQuery(null);
  }, []);

  const { refetch: refetchSearch } = search;
  const onSearch = useCallback(() => {
    const result = validateLocationQuery(query);
    if (!result.success) {
      setValidationError(result.error);
      setSubmittedQuery(null);
      return;
    }
    setValidationError(null);
    if (submittedQuery === result.value) void refetchSearch();
    else setSubmittedQuery(result.value);
  }, [query, submittedQuery, refetchSearch]);

  const onSelectLocation = useCallback((value: WeatherLocation) => {
    setLocation(value);
    setSubmittedQuery(null);
    setQuery([value.name, value.country].filter(Boolean).join(', '));
    setValidationError(null);
  }, []);

  const onSelectProvider = useCallback(
    (id: string) => {
      if (dependencies.providers.has(id)) setSelectedProviderId(id);
    },
    [dependencies.providers],
  );

  const {
    refetch: refetchForecast,
    isFetching: isForecastFetching,
    isPaused: isForecastPaused,
  } = forecast;
  const onRefresh = useCallback(() => {
    if (location && !isForecastFetching && !isForecastPaused) void refetchForecast();
  }, [location, refetchForecast, isForecastFetching, isForecastPaused]);

  const searchError = search.isPaused
    ? 'You appear to be offline. Location search will resume when you reconnect.'
    : search.error
      ? toWeatherError(search.error).message
      : submittedQuery !== null && search.isSuccess && search.data.length === 0
        ? 'No locations found. Try a nearby city or a more specific name.'
        : null;

  return {
    selectedProviderId,
    query,
    validationError,
    locations: submittedQuery === null ? EMPTY_LOCATIONS : (search.data ?? EMPTY_LOCATIONS),
    isSearching: search.isFetching,
    searchError: submittedQuery === null ? null : searchError,
    location,
    weather: forecast.data,
    isLoading: location !== null && forecast.isPending && !forecast.isPaused,
    isRefreshing: forecast.isFetching && forecast.data !== undefined,
    weatherError: forecast.isPaused
      ? 'You appear to be offline. The forecast will update when you reconnect.'
      : forecast.error
        ? toWeatherError(forecast.error).message
        : null,
    onChangeQuery,
    onSearch,
    onSelectLocation,
    onSelectProvider,
    onRefresh,
  };
}
