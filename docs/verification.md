# Verification record

Version 1.2.0 verified on 26 October 2026 using Node 22.23.2 and npm 11.3.0 on Windows.

- The dependency graph is unchanged from the previously verified clean install; this revision adds no runtime packages.
- TypeScript, ESLint, and Prettier checks passed.
- All 241 tests passed across 24 suites, with baseline and scoped coverage gates satisfied.
- Source-layer coverage: 99.21% lines, 98.77% statements, 90.48% branches, and 98.79% functions. These measurements cover `src/`; App.tsx is outside that instrumentation scope but its composition is exercised by AppExperience integration tests. The application error boundary is inside `src/bootstrap/` and is tested.
- Domain coverage: 100% across all measures.
- Orchestration hook coverage: 100% lines and functions, 92.68% branches.
- Provider catalog and privacy-filtered logger coverage: 100% across all measures.
- Theme catalog and selection/style context coverage: 100% across all measures. Parameterized tests and independent calculations verify semantic normal-text contrast of at least 4.5:1 in all six presets.
- An intentional UI import in a domain lint probe was correctly rejected by the enforced dependency boundaries.
- Expo Doctor passed all 20 checks.
- Production JavaScript exports completed for Android, iOS, and web.
- Real geocoding, Open-Meteo, and MET Norway requests returned HTTP 200.
- Production web-export interaction checks verified city candidates, live conditions, and automatic provider changes without re-entering a location. Input validation and offline recovery are also covered by unit tests.
- Mobile-width and tablet-width browser checks found no horizontal control overflow at 320px and 1024px. Browser console checks reported no warnings or errors.
- Application source contains no code comments. A token scan found no credential patterns in tracked deliverables.
- Rendering tests verify search edits leave expensive forecast artwork unchanged, while relevant weather updates render correctly.
- App integration tests verify appearance changes preserve service instances, selected provider/location, request counts, and the session assistant conversation.
- Production browser checks verified all six appearance palettes, explicit checked/expanded ARIA states, Enter submission, Escape dismissal, and focus restoration for both modals.
- At 320×480, the appearance grid scrolls to its last preset while close controls stay visible; assistant input/send/close controls remain inside the viewport.
- All six plotted point centers exactly matched their detailed reading centers in the production DOM check. Footer attribution actions did not overlap the floating launcher at the end of the scroll.
- Assistant replies produced no network requests; only the two explicitly selected weather sources were requested in that browser flow.
- Independent agent architecture and privacy review passes found no open high- or medium-priority findings after the fixes. No human certification is implied.

The screenshots in `docs/screenshots/` show the web target with live data. No Android emulator, iOS simulator, signed binary, or physical-device run was available in this environment. Device verification remains a release step described in [testing](testing.md).

The dependency audit is not clean: five package findings arise from two upstream tooling advisories, detailed in [SECURITY.md](../SECURITY.md). The audit is reported separately from the checks above.

The public repository is published. The owner has chosen to keep GitHub Actions as a template. The exact workflow is included at `docs/ci.workflow.yml`, with optional activation instructions in [CI](ci.md).
