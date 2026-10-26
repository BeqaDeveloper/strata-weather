# Security

This app contains no credentials, location permissions, analytics, or authentication. Location search terms and selected coordinates are transmitted over HTTPS to the providers documented in `docs/providers.md`. In-memory caches are cleared when the process ends. Runtime weather payloads are validated before reaching the UI.

Application logging is explicit and privacy filtered. The typed logger reconstructs allowlisted fields, excludes URLs, coordinates, search terms, payloads, headers, and exception details, and isolates reporting failures. Development uses a console sink; production is silent unless an external reporting adapter is deliberately injected. Framework and developer-tool logs are outside this application logger's contract.

## Dependency audit: 26 October 2026

`npm audit` reports five high-severity package findings arising from two underlying advisories in Expo SDK 58’s tooling dependency chain:

- [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv): `node-forge@1.4.0`, used by Expo CLI and its code-signing certificate tooling. The advisory lists no patched release. This app does not perform certificate verification or use node-forge in its weather runtime.
- [Zod oversized collection validation](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): Expo CLI resolves its own `zod@3.25.76`. The application adapters use `zod@4.6.7`, which is above the patched version `4.6.6`. Forcing the CLI onto a different major version can break its APIs and is not a safe dependency override.

Expo itself and intermediate CLI packages appear in the audit because they depend on those affected packages. This repository does not claim a clean dependency audit. The prepared CI workflow publishes the current audit output as a quality report when enabled; audit findings do not suppress the TypeScript, lint, test, or bundle gates. See `docs/ci.md` for activation.

Recheck these advisories when updating the Expo SDK. Do not apply `npm audit fix --force` without reviewing the resulting SDK and API changes. Do not expose development servers to untrusted networks. Signed distribution and update-signing workflows require a fresh tooling review before release.

## Reporting

For a security issue, use GitHub’s private vulnerability reporting when available on this repository. Never include credentials or personal location history in a public issue.
