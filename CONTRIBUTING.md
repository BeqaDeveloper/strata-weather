# Contributing

Use Node 22 and `npm ci`. Keep provider-specific formats inside infrastructure adapters and UI-specific styling inside presentation. Use `npx expo install` for dependency changes to preserve SDK compatibility. Commit the lockfile with dependency changes.

Use descriptive names, strict types, and small focused modules. Avoid application code comments; put rationale and integration instructions in `docs/`. Add tests for observable behavior and meaningful failure modes when changing request or provider logic.

Run `npm run check`, `npx expo-doctor`, and `npm run export:all` before submitting changes. Document any device verification separately from automated checks. Do not commit credentials, environment files, generated native directories, or build output.
