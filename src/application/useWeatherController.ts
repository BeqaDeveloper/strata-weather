import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { WeatherError, toWeatherError } from '../domain/errors';
import { validateLocationQuery } from '../domain/validation';
import type { LocationSearch, WeatherLocation, WeatherProvider } from '../domain/weather';

export interface WeatherDependencies {
  readonly providers: ReadonlyMap<string, WeatherProvider>;
  readonly locationSearch: LocationSearch;
  readonly initialProviderId: string;
}

export function shouldRetryRequest(failureCount: number, error: Error): boolean {
  return failureCount < 1 && error instanceof WeatherError && error.retryable;
}

export function useWeatherController(dependencies: WeatherDependencies) {
  const [selectedProviderId, setSelectedProviderId] = useState(dependencies.initialProviderId);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [location, setLocation] = useState<WeatherLocation | null>(null);
  const provider = dependencies.providers.get(selectedProviderId);

  if (!provider) throw new Error(`Weather provider is not registered: ${selectedProviderId}`);

  const search = useQuery({
    queryKey: ['locations', submittedQuery],
    queryFn: ({ signal }) => dependencies.locationSearch.search(submittedQuery ?? '', signal),
    enabled: submittedQuery !== null,
    staleTime: 24 * 60 * 60 * 1000,
    retry: shouldRetryRequest,
  });

  const forecast = useQuery({
    queryKey: ['weather', provider.id, location?.id, location?.latitude, location?.longitude],
    queryFn: ({ signal }) => {
      if (!location) throw new Error('Choose a location before requesting weather.');
      return provider.getWeather(location, signal);
    },
    enabled: location !== null,
    staleTime: 0,
    retry: shouldRetryRequest,
  });

  function onChangeQuery(value: string) {
    setQuery(value);
    setValidationError(null);
    setSubmittedQuery(null);
  }

  function onSearch() {
    const result = validateLocationQuery(query);
    if (!result.success) {
      setValidationError(result.error);
      setSubmittedQuery(null);
      return;
    }
    setValidationError(null);
    if (submittedQuery === result.value) void search.refetch();
    else setSubmittedQuery(result.value);
  }

  function onSelectLocation(value: WeatherLocation) {
    setLocation(value);
    setSubmittedQuery(null);
    setQuery([value.name, value.country].filter(Boolean).join(', '));
    setValidationError(null);
  }

  function onSelectProvider(id: string) {
    if (dependencies.providers.has(id)) setSelectedProviderId(id);
  }

  function onRefresh() {
    if (location && !forecast.isFetching) void forecast.refetch();
  }

  const searchError = search.error
    ? toWeatherError(search.error).message
    : submittedQuery !== null && search.isSuccess && search.data.length === 0
      ? 'No locations found. Try a nearby city or a more specific name.'
      : null;

  return {
    selectedProviderId,
    query,
    validationError,
    locations: submittedQuery === null ? [] : (search.data ?? []),
    isSearching: search.isFetching,
    searchError: submittedQuery === null ? null : searchError,
    location,
    weather: forecast.data,
    isLoading: location !== null && forecast.isPending,
    isRefreshing: forecast.isFetching && forecast.data !== undefined,
    weatherError: forecast.error ? toWeatherError(forecast.error).message : null,
    onChangeQuery,
    onSearch,
    onSelectLocation,
    onSelectProvider,
    onRefresh,
  };
}
