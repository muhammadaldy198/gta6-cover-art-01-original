# Local verification — After Hours

Locally verified on 2026-11-21 with Node 22.23.4 and Chrome 152.0.7977.64. This candidate has no submission, server score or placement.

## Executed checks

- `node --test tests/*.test.mjs`: 10 passed, 0 failed. The audit regression first reproduced the bug where an explicit path was ignored in favor of old output. It now verifies an actual build and rejects stale app or screenshot bytes independently. Geometry covers 324 pan/zoom/crop combinations, all three layouts and export ratios, and space for photo labels in the showcased compositions. Grade tests check warmer sunlight, rose/violet neon, warm skin retention and unknown-grade fallback.
- `python3 tests/browser_smoke.py`: 1 smoke scenario passed (three panels load; Chrome downloads a real PNG).
- `python3 tests/browser_flow.py`: 14 checks passed, including real local multi-file input offline, corrupt-file recovery, live title/caption editing, independent pan and zoom, one-photo fill, nine layout/grade combinations, dragging, focus and Escape, five viewport widths, and actual PNG downloads at 1920 × 1080, 1080 × 1350 and 1080 × 1080. No external requests, failed local responses or JavaScript errors.
- `python3 tests/accessibility.py`: axe reported 26 passed rules and zero violations at each of 1280 × 1080 and 390 × 844. Automated results do not establish complete WCAG conformance. No manual screen-reader or other-browser coverage is claimed.
- `python3 tests/capture.py`: captured four new images from the final renderer. Each artwork comes from an actual PNG downloaded via the editor, with its original dimensions verified before sizing and JPEG encoding. The editor screenshot is a direct Chrome viewport capture; it includes the complete preview, photo input, panel controls and export button.
- `main.ts` ran twice to fresh output directories under `.qa/final/`. Recursive `diff` and `cmp` found byte-identical outputs. `node tests/audit.mjs <fresh-output-a>` verified exact source bytes for all app and screenshot copies, 11 local references, JS syntax, 12 app files (15 entries, 1,396,465 bytes), 17 world-readable output files and an exact dossier reconstruction. The dossier is 1,134,551 bytes; SHA-256 `e04c4596ae68d004f31ab05d5b577eece995134d3e9ce544da4d1707e4532890`.
- `cmp` matched `vendor/makefun-app.ts` byte-for-byte with `starter/vendor/makefun-app.ts` from the kit. Both have SHA-256 `14e650adbd6aff7fb760e9bcd7be00dfbe86fb4819afe88dfe23dd0e087e770e`. `git diff --check` reported no errors.

## Screenshot manifest

| File | Dimensions | Bytes |
| --- | --- | ---: |
| 01-after-hours-cover.jpg | 1280 × 720 | 199148 |
| 02-after-hours-studio.jpg | 1280 × 960 | 212301 |
| 03-last-check-in-portrait.jpg | 864 × 1080 | 201408 |
| 04-neon-alibi-square.jpg | 1080 × 1080 | 208260 |

All are within the kit's 262,144-byte ceiling and size limits; names and dimensions match `shots.json`. The app uses only the two official kit photos for these captures. The full-resolution PNGs, audit and comparison images remain under ignored `.qa/`.

## Visual comparison and limits

Compared the continuation baseline and final captures at full size and with lead images fitted into the judge's 768 × 480 box (768 × 432 actual); the supporting strip is an approximation. The final cover trades some cool daylight cast for warmer highlights, shows the fishing grip and reel more clearly, and retains the oversized cream italic title and coral ribbon. The portrait and square detail labels now clear the title; the square's rose/violet treatment is visible in the photos, not just the ribbon. The wide detail remains a tight crop, and the cover still has more of a coastal editorial look than a dense cast montage.

The [development leaderboard](https://make.fun/api/competitions/gta6-cover-art-01/leaderboard?view=performance) fetched at 05:52 UTC showed 7,007 rows. The eligible provisional rank [10](https://make.fun/api/submissions/01a1f705-a839-71d0-96f0-dd7ff4c3bec0/artifact.webp?phase=dev) was 946826 and rank [50](https://make.fun/api/submissions/01a1f88c-61fe-76ad-ac04-2d0c367ac2ec/artifact.webp?phase=dev) was 929191 in the API's raw units. Side-by-side inspection of their published covers and support images favored both on the first criterion: their wider cast and scene variety tell more of a crime-world story at a glance, and their color and lettering read more like ensemble game key art. This is a comparative visual check, not a judge verdict or a forecast; the images alone do not verify rivals' editing behavior. No competitor source or assets are used in the app or deliverables.

## Intake boundary

The kit has no local official grade. Its local `check` does not establish combined recording coverage, authorship, witnessed transcript and run-record eligibility, or signature validity. A recording seal and a local skip are not proof of any of these. No entry was sent, no separate transcript bundle was uploaded, and no wallet, account or spending action was taken.
