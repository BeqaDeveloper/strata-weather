# Contributing

Use Node 22 and `npm ci`. Keep provider-specific formats inside infrastructure adapters and UI-specific styling inside presentation. Use `npx expo install` for dependency changes to preserve SDK compatibility. Commit the lockfile with dependency changes.

Use names that describe ownership: query policy, forecast geometry, provider catalog, or log events. Avoid catch-all helpers, utils, common, and manager modules. Promote code to shared when it has a narrow independent purpose and actual reuse. Favor small focused modules and strict types; put design rationale and integration instructions in `docs/` rather than boilerplate code comments.

Compose concrete dependencies in `src/bootstrap/createApplication.ts`. Pair each new adapter with its presentation, and test schema validation, unit conversion, unsupported capabilities, and failures. The domain must remain framework independent. ESLint enforces import boundaries; do not disable those rules to bypass a design problem.

Treat request identity, cancellation, cache eviction, offline pause, and stale-data behavior as public behavior. Keep expensive rendering independent of editable input, and add a rendering regression test when changing those boundaries. Use the shared logger for diagnostics, never ad hoc console calls or raw payload logging.

Run `npm run check`, `npm run doctor`, and `npm run export:all` before submitting changes. Document any device verification separately from automated checks. Do not commit credentials, environment files, generated native directories, or build output. Update docs when contracts, defaults, startup steps, or extension points change.
