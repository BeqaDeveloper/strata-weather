# Verification record

Version 1.1.0 verified on 26 October 2026 using Node 22.23.2 and npm 11.3.0 on Windows.

- A clean `npm ci` completed successfully from the committed lockfile.
- TypeScript, ESLint, and Prettier checks passed.
- All 197 tests passed across 18 suites, with baseline and scoped coverage gates satisfied.
- Source-layer coverage: 99.45% lines, 98.56% statements, 90.24% branches, and 100% functions. These measurements cover `src/`; App.tsx is outside that scope. The application error boundary is inside `src/bootstrap/` and is tested.
- Domain coverage: 100% across all measures.
- Orchestration hook coverage: 100% lines and functions, 92.68% branches.
- Provider catalog and privacy-filtered logger coverage: 100% across all measures.
- An intentional UI import in a domain lint probe was correctly rejected by the enforced dependency boundaries.
- Expo Doctor passed all 20 checks.
- Production JavaScript exports completed for Android, iOS, and web.
- Real geocoding, Open-Meteo, and MET Norway requests returned HTTP 200.
- Production web-export interaction checks verified city candidates, live conditions, and automatic provider changes without re-entering a location. Input validation and offline recovery are also covered by unit tests.
- Mobile-width and tablet-width browser checks found no horizontal control overflow at 320px and 1024px. Browser console checks reported no warnings or errors.
- Application source contains no code comments. A token scan found no credential patterns in tracked deliverables.
- Rendering tests verify search edits leave expensive forecast artwork unchanged, while relevant weather updates render correctly.
- Independent agent architecture and privacy review passes found no open high- or medium-priority findings after the fixes. No human certification is implied.

The screenshots in `docs/screenshots/` show the web target with live data. No Android emulator, iOS simulator, signed binary, or physical-device run was available in this environment. Device verification remains a release step described in [testing](testing.md).

The dependency audit is not clean: five package findings arise from two upstream tooling advisories, detailed in [SECURITY.md](../SECURITY.md). The audit is reported separately from the checks above.

The public repository is published. The owner has chosen to keep GitHub Actions as a template. The exact workflow is included at `docs/ci.workflow.yml`, with optional activation instructions in [CI](ci.md).
