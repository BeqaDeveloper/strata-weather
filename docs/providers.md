# Weather providers

Strata uses two separate weather APIs: Open-Meteo Forecast and the Norwegian Meteorological Institute's Locationforecast. The app makes real HTTPS requests and requires no API keys for this evaluation. Both return model-based weather; MET Norway is displayed as forecast data rather than a station observation.

## Contracts and ownership

`src/domain/weather.ts` owns the provider-independent `WeatherProvider`, `WeatherReport`, `WeatherLocation`, and `LocationSearch` contracts. A provider has an identifier and one operation, `getWeather(location, signal)`. Its result uses Celsius, kilometres per hour, relative humidity as a percentage, UTC ISO timestamps, normalized weather conditions, and explicit attribution. UI components never receive upstream response objects.

The implementations live in:

- `src/infrastructure/providers/openMeteoProvider.ts`: builds the Open-Meteo request, validates its shape and units, decodes WMO conditions, and selects up to six future forecast points.
- `src/infrastructure/providers/metNorwayProvider.ts`: validates Locationforecast, converts wind speed from metres per second to kilometres per hour, decodes MET symbols, and selects up to six forecast points after the current entry.
- `src/infrastructure/providers/conditions.ts`: maps both upstream condition schemes into the domain vocabulary. Unknown values remain `unknown`.
- `src/infrastructure/location/openMeteoLocationSearch.ts`: resolves city names or postal codes into selectable coordinates. Missing regions and countries remain empty; missing or unsupported timezones fall back to UTC.
- `src/infrastructure/http/httpClient.ts`: owns cancellation, a 12-second timeout, HTTP failures, JSON decoding, and opt-in HTTP caching.

Zod schemas verify the response before values reach the UI. Unit mismatches, invalid coordinates, missing required measurements, and malformed JSON become actionable errors. An unavailable capability is represented honestly: MET Norway does not supply apparent temperature in this adapter, so `feelsLikeCelsius` is `null` and the screen omits that metric.

## Replacing a service

1. Add an adapter under `src/infrastructure/providers/` that implements `WeatherProvider`. Validate the upstream payload at the boundary, convert units, normalize timestamps and conditions, and supply attribution. Pass the received `AbortSignal` into the HTTP client.
2. Test the mapping with representative fixtures, invalid payloads, optional capabilities, conditions, and unit conversions. Reuse the HTTP client instead of implementing transport inside a component.
3. Register the adapter in `src/application/createDependencies.ts`. Replace the retired adapter in that list and update `initialProviderId` if the default changes.
4. Replace the corresponding definition in `src/presentation/providers.ts`. Give it the same identifier as the adapter and provide its name, description, colors, and attribution link. Provider-specific styling stays in this presentation registry.
5. Run `npm run check`, `npm run export:all`, and the manual provider-switch checklist in the testing documentation.

The controller depends on a map of `WeatherProvider` objects and a `LocationSearch` object. A replacement service does not require rewriting location selection, request orchestration, or the weather cards. A genuinely new display capability may require extending the domain report and its presentation deliberately.

## Failure and refresh behavior

The selected provider identifier and location coordinates form part of the query key. Selecting another provider automatically requests that provider for the selected location; it does not repeat geocoding. TanStack Query cancels obsolete requests through the supplied signal and isolates cached reports by provider and location. A late response cannot replace the active provider's report.

The app keeps the selected service visible when a request fails. It offers retry and the other service instead of silently changing the source. A failed refresh may retain the same provider's previous report with a last-available label. Retryable network, timeout, and server errors receive at most one automatic retry. Invalid responses, authorization failures, rate limiting, cancellation, and deprecated endpoints are not automatically retried. HTTP 203 is treated as a retired/deprecated endpoint requiring another provider.

The two weather endpoints are separate, but city search is a shared dependency on Open-Meteo's geocoding service. A geocoding outage prevents new city searches for both providers. A city already selected remains usable with MET Norway because switching providers uses its existing coordinates. Replace `LocationSearch` independently in the composition root if independent location discovery is required. The APIs can also share upstream weather models, so separate endpoints do not imply independent meteorological source data.

## MET Norway request policy

Native requests identify the app with `StrataWeather/1.0 (https://github.com/BeqaDeveloper/strata-weather)`. Keep that identifier tied to a maintained contact destination when redistributing the app. Coordinates are rounded to four decimals to support the service's caching requirements.

The transport respects the response's `Expires` value before making another MET request. After expiration it sends `If-Modified-Since` when `Last-Modified` is available and reuses the cached body on HTTP 304. Missing expiry headers receive a conservative 60-second cache lifetime. The cache holds at most 100 responses in memory and resets when the app process restarts. There is no background polling.

Android and iOS are the intended targets. Browsers cannot set a custom `User-Agent`; MET instead evaluates the browser origin and may reject localhost or an unsuitable origin. The optional web export is useful for UI review but is not a guarantee of direct browser access to MET. A deployed browser product should use a compliant same-origin backend or caching proxy with valid identification. Larger native deployments also need centralized caching and rate control appropriate to aggregate traffic.

See the official [MET API terms](https://api.met.no/doc/TermsOfService), [Locationforecast guide](https://api.met.no/doc/locationforecast/HowTO), and [data model](https://api.met.no/doc/locationforecast/datamodel).

## Licensing and deployment

The repository's MIT license covers the application code. It does not replace the services' data licenses or API terms. Open-Meteo's free endpoints are intended for non-commercial use and have request limits. For a commercial release, choose an appropriate subscription or deployment arrangement and keep credentials on a backend. The weather data requires attribution under CC BY 4.0; the app displays its source. Location search credits Open-Meteo and GeoNames.

MET Norway's open data also requires attribution; the adapter identifies the provider, links to its license information, and states that wind units were converted. The official services do not provide an availability guarantee for these free integrations.

Review [Open-Meteo terms](https://open-meteo.com/en/terms), [Open-Meteo licensing](https://open-meteo.com/en/licence), [Open-Meteo geocoding documentation](https://open-meteo.com/en/docs/geocoding-api), and [MET Norway licensing](https://api.met.no/doc/License) before distributing a derivative application. Direct API requests expose the device's IP address and searched location or coordinates to the relevant service.
