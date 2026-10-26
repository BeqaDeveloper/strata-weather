# Testing

## Commands

```sh
npm test
npm run test:coverage
npm run typecheck
npm run lint
npm run format:check
npm run check
npm run doctor
npm run export:all
```

Jest uses `jest-expo` and React Native Testing Library. The suite runs offline. Each hook test creates a fresh QueryClient and injects its own location and weather services. Adapter tests use realistic remote payloads, and HTTP tests inject fetch and clock behavior.

Baseline coverage gates require 90% lines and statements, 80% branches, and 85% functions. Separate gates apply to domain rules, infrastructure, and orchestration; provider catalog invariants and the privacy-safe logger require full coverage. Jest evaluates scoped paths separately and removes them from the baseline pool, so highly covered adapters cannot conceal missing UI or lifecycle tests. Coverage is a guardrail; assertions focus on user behavior and failure boundaries.

## Behaviors to preserve

- Invalid input causes no lookup request; international names remain supported.
- A search displays explicit location choices and a useful no-results state.
- Switching services with an existing selection requests the new service automatically.
- Switching before selection causes no weather request.
- Late or cancelled requests cannot replace the latest selection’s report.
- Query identity includes coordinates as well as the service.
- Retry and refresh recover after a service failure.
- Unknown or malformed response data is rejected before rendering.
- Transport timeouts, cancellation, rate limits, endpoint retirement, and caching remain predictable.
- MET Norway converts wind to km/h and omits unsupported feels-like measurements.
- Both providers use the same condition vocabulary.
- Duplicate registrations, missing presentation identities, and invalid defaults fail before requests begin.
- Editing the search input does not rerender expensive forecast artwork; weather changes still update it.
- Offline pauses are visible without endless loading and resume on reconnection.
- Native focus and network subscriptions are cleaned up once and ignore late callbacks.
- A malformed MET cache entry is evicted so a retry can recover from a corrected payload.
- Unknown current or hourly daylight never produces a daylight claim or assumed sun icon.
- Logs retain only allowlisted diagnostic fields; a broken reporting adapter cannot break requests or recovery UI.
- Forecast geometry respects real elapsed time, including uneven intervals and flat temperatures.
- Forecast trace points and detailed readings share one scrolling time axis; extreme spacing uses a bounded fallback.
- Every theme preset maintains the tested text/background contrast pairs, with selections generated from one typed catalog.
- Appearance changes preserve the weather runtime, selected source/location, and request counts.
- The assistant validates messages, caps session history, uses only scripted coming-soon replies, and makes no requests.
- An assistant conversation survives closing, reopening, and appearance changes within the session.

## Device checklist

Before distributing a signed release, verify Android and iOS on actual devices or simulators:

1. Search for Tbilisi, choose the intended result, and verify live weather with each service.
2. Switch services repeatedly while requests are running; confirm labels and measurements agree.
3. Test offline launch, offline refresh, restoration of connectivity, and provider errors.
4. Test empty, whitespace-only, too-short, long, and international city input.
5. Check keyboard submit, small screens, tablets, safe areas, large text, TalkBack, and VoiceOver.
6. Verify external attribution links and pull-to-refresh behavior.
7. Confirm MET Norway receives the identifying User-Agent from the native networking stack.
8. Background and resume the app; confirm stale weather refreshes without duplicating subscriptions.
9. Enable development logging and confirm records contain endpoint categories and codes without user search terms or coordinates.
10. Try every appearance with both providers, errors, and the assistant; verify platform keyboards and readable scene overlays.
11. Open and close both modals with hardware back/Escape and explicit controls; check focus restoration and screen-reader announcements.
12. Scroll the forecast horizontally and confirm readings stay aligned with their plotted points. Scroll to the footer and confirm the assistant launcher does not cover attribution actions.

Native JavaScript exports establish that both platform bundles compile. They do not create signed installable binaries and do not substitute for device tests.
