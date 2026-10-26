# Architecture and engineering

## Design goals

Keep provider changes local, make asynchronous state predictable, preserve a clear source identity, and keep presentation independent from remote payloads. The project uses explicit contracts and a small composition root. It does not require a dependency-injection framework, a generic repository abstraction, or a global client-state store.

## Boundaries and ownership

`domain` defines `WeatherProvider`, `LocationSearch`, `WeatherReport`, location data, canonical conditions, validation, and typed failures. It has no dependency on React, Expo, network transport, or application modules.

`application` coordinates editable input, explicit location selection, provider selection, query keys, cache policy, and recovery. It consumes domain ports. It cannot import concrete adapters or presentation. `ports.ts`, `queryKeys.ts`, and `queryPolicy.ts` give those concepts descriptive homes rather than hiding them in a broad helper file.

`infrastructure` owns the real services: transport, geocoding, response schemas, unit conversion, and condition normalization. Remote JSON begins as `unknown`. A provider's payload shape never escapes its adapter. Infrastructure cannot depend on orchestration or UI.

`presentation` owns the experience and its weather-specific components. It receives normalized values and actions through props. It cannot import concrete infrastructure or bootstrap code. Original SVG artwork and forecast geometry stay beside the weather feature.

`shared/ui` contains controls and visual tokens already reused across the experience. `shared/observability` contains the typed logging contract and sink adapters. Neither imports higher-level application, infrastructure, or presentation modules. Promote code to shared when it has independent meaning and actual reuse; do not move every small function there.

`platform` bridges native app focus and connectivity to query lifecycle events. `bootstrap` assembles all concrete implementations, validates provider registration, creates a QueryClient, and owns the application error boundary. App.tsx creates one runtime per app session inside the recovery boundary. Tests create isolated runtimes or inject ports.

ESLint's restricted-path zones enforce these dependency directions. TypeScript runs with strict checks, unchecked-index checks, explicit override checks, unused-code checks, and implicit-return checks.

## Adding or replacing a service

A registration pairs an adapter and its presentation descriptor in `bootstrap/createApplication.ts`. `createProviderCatalog` rejects an empty catalog, duplicate adapter IDs, adapter/theme mismatches, blank identifiers, and an unregistered default. The screen also refuses a missing theme rather than borrowing another service's identity.

Add the adapter and its tests, define the visual descriptor, and add the registration pair. The controller still calls `getWeather(location, signal)` and the UI still renders `WeatherReport`. Changing a provider does not require editing the controller or branching inside weather components.

The catalog exposes readonly TypeScript interfaces. This is a validated configuration snapshot, not a claim of deep runtime immutability. Treat adapters and descriptors as session configuration.

## Request and cache lifecycle

Editing input performs no lookup. Submit validates and normalizes it. The user chooses an explicit location candidate. Query keys include provider, location identity, coordinates, and timezone; responses cannot cross source or location identities.

Query cancellation reaches native fetch through AbortSignal. A late result cannot replace the active query. Search results are fresh for 24 hours. Weather is stale immediately for source changes and foreground refresh. Inactive query entries are retained for 15 minutes. Provider-specific HTTP freshness still applies, so refreshing a valid MET cache does not violate its request policy.

The HTTP cache is bounded to 100 entries. It honors Expires and conditionally revalidates with Last-Modified. MET's adapter evicts a cached body when runtime schema validation rejects it; this is tested by following a malformed response with a valid network response. The cache stores unknown JSON; schema validity belongs to the adapter.

Transient network, timeout, and server failures permit one retry after a short delay. Invalid payloads, rate limits, permission failures, retired endpoints, and unexpected defects do not retry automatically. There is no silent source fallback. A failed refresh can preserve the same provider's report with an explicit last-available label.

## Native lifecycle and offline behavior

AppState informs the query focus manager. NetInfo informs the online manager. Known disconnection or unreachable internet pauses work; completely unknown connectivity preserves the current state. When the app returns to the foreground or connectivity returns, stale or paused work can resume.

Paused work is visible. Search explains that it will resume after reconnection. A paused forecast stops the initial loading spinner, shows the offline message, and retains any previous report as last available. Recovery does not require re-entering the place.

Subscriptions are removed on unmount. Cleanup is idempotent and late callbacks are ignored. Browser behavior is left to TanStack Query's browser listeners. Native lifecycle logic is tested through an injected bridge rather than depending on a real device's connectivity.

## Rendering decisions

`WeatherCard`, `WeatherScene`, `HourlyForecast`, provider selection, and source attribution have focused rendering boundaries. The controller stabilizes refresh, location, and provider actions. Query results retain reference identity when unrelated input changes. This allows memoized expensive subtrees to remain untouched during typing.

Tests confirm that changing search input does not rerender the expensive scene and that controller weather actions remain stable. This is a concrete render-isolation guarantee, not a claim about measured frame rates on every device. Profiling a physical device remains the next step when a real performance issue appears.

Memoization is selective. Simple text and controls are not wrapped reflexively. Forecast data is bounded to a few points. SVG artwork is deterministic and uses bounded paths and gradients with no animation loop or remote image fetch. The forecast trace follows real elapsed time rather than evenly distributing irregular intervals.

Daylight is `boolean | null`. An unknown current or hourly value gets neutral artwork and wording. Missing feels-like temperature omits that metric. Accessibility labels expose forecast values even though decorative SVGs are hidden from assistive technology.

## Error reporting and logging

WeatherError separates network, timeout, rate-limit, unavailable, invalid-response, cancelled, and unexpected failures. Unknown errors become nonretryable unexpected failures. The transport explicitly classifies actual fetch failures as network errors. Friendly UI messages do not expose service payloads or exception details.

The logging port accepts a discriminated union of event shapes. Runtime sanitization reconstructs the allowed fields before calling a sink, so extra properties are removed even if an untyped caller supplies them. Endpoint names and failure codes are allowlisted; duration and status fields are sanitized.

HTTP events describe individual attempts and cache decisions. `query.failed` describes a final query failure after retries, including adapter decoding failures. `app.render_failed` describes an unexpected rendering failure using a fixed code. Cancellations are debug events, not operational errors.

The app logger never includes raw URLs, query keys, user input, coordinates, payloads, headers, exception messages, or stacks. Development uses an explicit console sink. Production uses silentLogger until a reporting destination is deliberately supplied. Framework or developer-tool output is outside this application logger's filtering contract.

Inject a reporting adapter at bootstrap without changing features:

```ts
const logger = createLogger((record) => reportingAdapter.write(record));
const application = createApplication(logger);
```

The sink receives sanitized structured records. Sink failures and custom logger failures are isolated with best-effort reporting and cannot replace the original query failure or remove the recovery UI. No external reporting service or credentials are configured by default.

## Extension conventions

For a new external dependency, define a narrow domain port, implement it at infrastructure's edge, validate the boundary, and inject it through bootstrap. For a new UI capability, extend the domain model deliberately and model unsupported values explicitly.

For saved places, add a storage port and a persistence adapter before introducing durable state. For multiple screens, introduce navigation at that point and keep route code separate from feature components. For a secret-bearing provider, use a backend; mobile bundles cannot keep a private API key secret.

Names should describe the thing they own: forecast geometry, query policy, location lookup, or log events. Avoid files named helpers, common, manager, or utils when a more specific name is available. Each new abstraction should remove real duplication or protect a meaningful boundary.

## Review and limits

Two independent agent review passes covered architecture and privacy. The resulting fixes included centralized registration, malformed-cache eviction, unexpected-error classification, isolated reporting, offline pause recovery, daylight truthfulness, and render isolation. No human architect certification is implied.

Automated tests establish behavior and dependency boundaries. Platform exports establish compilation. Neither establishes screen-reader quality, native networking, signed distribution, battery use, or frame timing on physical hardware. Follow the device checklist before a store release.
