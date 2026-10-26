# Strata Weather

A little clarity, whatever the weather. A mobile weather app built with React Native, TypeScript, and Expo, with interchangeable weather services and a visual identity for each one.

Search for a city, choose the correct location, and switch between Open-Meteo and MET Norway. The forecast updates automatically for the selected location. No API keys or account setup are required.

<img src="docs/screenshots/open-meteo.png" alt="Open-Meteo with warm colors and a Tbilisi forecast" width="300" /> <img src="docs/screenshots/met-norway.png" alt="MET Norway with a violet theme for the same location" width="300" />

Mobile-width web previews using live data. Native device verification is listed in the testing checklist.

## Run locally

Use Node.js 22 LTS and npm. Versions are locked in `package-lock.json`.

```sh
git clone https://github.com/BeqaDeveloper/strata-weather.git
cd strata-weather
npm ci
npm start
```

Open the project in a compatible Expo Go version or a development build. Press `a` for a configured Android emulator. An iOS simulator requires macOS. The app targets Expo SDK 58; Expo Go availability may lag a new SDK release, in which case use a development build.

```sh
npx expo run:android
npx expo run:ios
```

`npm run web` opens a useful secondary browser preview. Native Android and iOS are the intended platforms. MET Norway requires an identifying request header that browsers control, so localhost browser requests may be blocked by that provider. See [provider documentation](docs/providers.md).

## What is included

- Explicit location search with disambiguation, Unicode input validation, and helpful empty states.
- Two live weather providers, normalized into one domain model.
- Automatic forecast loading on service changes, with independent caches and cancellation of obsolete requests.
- Current conditions, local forecast time, humidity, wind, available feels-like temperature, and upcoming forecast points.
- Provider-specific colors and artwork through presentation descriptors.
- Accessible controls, scalable text, safe areas, responsive layouts, and retry states.
- Strict TypeScript, runtime API validation with Zod, ESLint, Prettier, unit tests, and a ready-to-enable GitHub Actions workflow.
- No application code comments; design decisions and extension instructions live in documentation.

## Quality checks

```sh
npm run check
npx expo-doctor
npm run export:all
```

`check` runs TypeScript, lint, formatting, and unit tests with coverage thresholds. Test requests use injected services or mocked HTTP responses; they never depend on external weather availability. See [testing](docs/testing.md) for the test strategy and device checklist.

Known upstream tooling advisories and their dependency paths are documented in [SECURITY.md](SECURITY.md).

The [verification record](docs/verification.md) lists the completed checks and platform limits.

The [CI workflow](docs/ci.workflow.yml) runs these same checks on GitHub. Activation requires workflow write access, which the publishing credentials did not have; see [enabling CI](docs/ci.md).

## Structure

```text
App.tsx
src/
  domain/
  application/
  infrastructure/
    http/
    location/
    providers/
  presentation/
docs/
```

The domain defines plain TypeScript contracts. Infrastructure translates remote APIs into those contracts. The application layer coordinates search, selection, requests, and cache lifetimes. Presentation renders provider-independent weather data using a selected visual scheme. Dependency construction is centralized in `src/application/createDependencies.ts`.

Read [architecture](docs/architecture.md) for boundaries, failure behavior, and the rationale behind the main choices. Read [providers](docs/providers.md) to add or replace a service without rewriting the screen.

## Scope

Weather values are forecasts, not guaranteed observations. All temperatures use Celsius and wind uses km/h. Optional measurements are omitted when a provider cannot supply them. Locations and forecasts are held in memory for the current session; persistence, device geolocation, and background refresh are intentionally outside this assignment.

The public Open-Meteo endpoint is intended for non-commercial evaluation under its current terms. Commercial deployment needs a suitable service plan and review of both providers’ terms. Weather data and location datasets retain their own attribution requirements; the source attribution is shown in the app.

## License

Application code is MIT licensed. Weather data is attributed to [Open-Meteo](https://open-meteo.com/), [MET Norway](https://api.met.no/doc/License), and location data to [GeoNames](https://www.geonames.org/), accessed through Open-Meteo’s geocoding API.
