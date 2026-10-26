# Architecture

## Boundaries

`src/domain/weather.ts` owns the location, condition, report, and provider contracts. It imports no React Native, Expo, network, or state-management code. Provider IDs remain strings so adding an implementation does not require extending a union throughout the app.

`src/infrastructure` owns HTTP transport, provider payload schemas, geocoding, condition mappings, unit conversion, and remote attribution. JSON enters the app as `unknown` and is checked against a Zod schema before use. Payload structures do not escape their adapters.

`src/application` owns orchestration. Dependencies are supplied through `WeatherDependencies`; tests can inject deterministic services without mocking the UI or global network. `createDependencies` is the composition root for live adapters. TanStack Query owns server-state caching and request lifecycles. Small local React state owns editable input, the selected location, and the selected service.

`src/presentation` owns rendering, accessible controls, formatting, and visual schemes. Components consume normalized weather. They do not inspect provider payloads, perform HTTP requests, or branch on provider IDs. A provider’s visual descriptor can change colors, explanatory copy, and artwork independently of its network adapter.

## Search and refresh

Editing the search field does not trigger requests. Submitting validates and normalizes input before location lookup. The user explicitly selects a candidate, avoiding silent guesses for cities with the same name. Editing an active search cancels the obsolete request and hides its results.

Weather query keys include the provider ID, location ID, latitude, and longitude. Selecting another service changes the key, requests that service for the existing location, and applies its visual scheme immediately. Changing services before selecting a location causes no weather request.

Each query consumes its AbortSignal through the HTTP transport. Obsolete requests are cancelled. Query-key isolation also prevents late responses from a previous service or location from replacing the selected forecast. A zero weather stale time causes a refresh when switching back to an already visited provider. Transport-level cache rules still honor MET Norway’s freshness requirements.

Search results are fresh for 24 hours. Query entries are retained for 15 minutes after becoming inactive. The HTTP response cache is bounded to 100 entries. This application keeps caches in memory and does not store a user’s location on disk.

## Failures

Network and timeout failures permit one automatic retry with a short delay. Rate limits, permission failures, retired endpoints, and invalid payloads require an explicit retry or a service switch. Every network operation has a timeout and releases abort listeners and timers when complete.

A failure for the newly selected service does not show another service’s weather under the new identity. A failed refresh for a report already shown retains the same service’s last available report with a visible status. There is no silent provider fallback: the user retains control over the source.

Geocoding is a separate injected interface. Both weather services currently use Open-Meteo’s location lookup. Existing selected coordinates continue to work if lookup becomes unavailable, but new searches cannot complete until lookup recovers or is replaced.

An application boundary provides recovery for unexpected rendering failures. Expected service errors are handled within the screen and do not reach that boundary.

## Performance and maintenance

No network request runs per keystroke. Service switching uses the existing resolved coordinates rather than repeating geocoding. Requests are cancelled when no longer relevant, and small forecast lists are limited before reaching presentation. There is no navigation framework or global client-state store for this single-screen app.

The app uses React Native’s native rendering and Expo’s compatible package versions. Correct request lifecycles and bounded work take priority over speculative memoization. There are no timers for background polling, large animation frameworks, or remote image dependencies.

To grow this app, add independent features with their own contracts and application logic. A backend adapter is the appropriate place for future secret-bearing providers; mobile bundles cannot keep API keys secret. Add persistent storage behind an interface if saved places become a requirement, and add navigation when additional screens exist.

## Deliberate tradeoffs

MET Norway supplies forecast values and does not supply the same apparent-temperature measurement as Open-Meteo, so feels-like is optional. All times are normalized to ISO timestamps and formatted with the location’s timezone. Provider attribution remains attached to each report rather than inferred from the selected toggle.

Unit tests exercise domain rules, real adapter decoders, HTTP behavior, and hook transitions. They establish logic correctness; device rendering, screen readers, platform networking, and store signing need device-level verification before a production release.
