# Verification record

Verified on 26 October 2026 using Node 22.23.2 and npm 11.3.0 on Windows.

- A clean `npm ci` completed successfully from the committed lockfile.
- TypeScript, ESLint, and Prettier checks passed.
- All 127 tests passed across 10 suites, with coverage gates satisfied.
- Source-layer coverage: 94.83% lines, 94.75% statements, 89.57% branches, and 87.30% functions. These measurements cover `src/`; the root application boundary is outside that scope.
- Domain coverage: 100% across all measures.
- Orchestration hook coverage: 100% lines and functions, 92.10% branches.
- Expo Doctor passed all 20 checks.
- Production JavaScript exports completed for Android, iOS, and web.
- Real geocoding, Open-Meteo, and MET Norway requests returned HTTP 200.
- Browser interaction checks verified input validation, city candidates, live conditions, and automatic provider changes without re-entering a location.
- Mobile-width and tablet-width browser checks found no horizontal control overflow at 320px and 1024px. Browser console checks reported no warnings or errors.
- Application source contains no code comments. A token scan found no credential patterns in tracked deliverables.

The screenshots in `docs/screenshots/` show the web target with live data. No Android emulator, iOS simulator, signed binary, or physical-device run was available in this environment. Device verification remains a release step described in [testing](testing.md).

The dependency audit is not clean: five package findings arise from two upstream tooling advisories, detailed in [SECURITY.md](../SECURITY.md). The audit is reported separately from the checks above.
