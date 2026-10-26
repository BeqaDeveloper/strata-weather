# Testing

## Commands

```sh
npm test
npm run test:coverage
npm run typecheck
npm run lint
npm run format:check
npm run check
npx expo-doctor
npm run export:all
```

Jest uses `jest-expo` and React Native Testing Library. The suite runs offline. Each hook test creates a fresh QueryClient and injects its own location and weather services. Adapter tests use realistic remote payloads, and HTTP tests inject fetch and clock behavior.

Coverage gates apply independently to domain rules, infrastructure, and orchestration, so one well-covered layer cannot conceal missing tests in another. UI formatting and conditional provider presentation are tested separately. Coverage is a guardrail; assertions focus on user behavior and failure boundaries.

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

## Device checklist

Before distributing a signed release, verify Android and iOS on actual devices or simulators:

1. Search for Tbilisi, choose the intended result, and verify live weather with each service.
2. Switch services repeatedly while requests are running; confirm labels and measurements agree.
3. Test offline launch, offline refresh, restoration of connectivity, and provider errors.
4. Test empty, whitespace-only, too-short, long, and international city input.
5. Check keyboard submit, small screens, tablets, safe areas, large text, TalkBack, and VoiceOver.
6. Verify external attribution links and pull-to-refresh behavior.
7. Confirm MET Norway receives the identifying User-Agent from the native networking stack.

Native JavaScript exports establish that both platform bundles compile. They do not create signed installable binaries and do not substitute for device tests.
