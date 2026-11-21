# Local verification — seven-scene After Hours

Verified locally on 21 November 2026 with Node 22.23.4 and installed desktop Chrome, headless. This is a tested local candidate, not a submission, score or paid placement. The prior committed baseline is d6c519930468865a1df7a0437701a6311985a8da; useful dirty print/velocity work was preserved.

## Implemented correction

The default is now seven real, independently selectable polygon panels, not three panels or repeated crops. One central hero and six surrounding scenes have seven distinct source files and seven distinct SHA-256 values. Sources are two fictional-person kit photographs, four CC0 non-person scene photographs, and one original MIT motel illustration. README contains source, creator, license and download-page provenance. Wikimedia image serving was blocked by HTTP 429/403, so the same verified CC0 works were obtained from their original publishers. A second car photograph containing background people was rejected and is not delivered.

The seven-panel geometry tiles the canvas before gutters at all three ratios. All panel sources, zoom and both crop axes are independent. Legacy layouts intentionally show three controls, preserve hidden crops and return to all seven. Seven-file upload assigns seven different inputs in order; a one-photo fill is explicit, never the default showcase. All treatment styles remain available. The cached print processor is reused while cropping/typing/exporting. The lettering crosses seams without an opaque ribbon; the seven-scene layout has no floating room-key prop.

## Completed checks

- `node --test tests/*.test.mjs`: 20 passed, 0 failed. New seven-panel geometry/source tests first failed with three frames and a missing model, then passed after implementation. The suite checks crop bounds over 324 input/pan/zoom combinations; original layout behavior; seven-polygon area and unique hit targets; distinct source bytes; immutable replacement and independent one-photo fill; screenshot manifest; grade/print behavior; and exact-output audit regressions. An inherited failing neon-skin assertion was reproduced and repaired by restoring warm midtones, not weakening its threshold.
- `python3 tests/browser_smoke.py`: passed; real seven-panel editor and actual PNG download.
- `python3 tests/browser_flow.py`: 14 passed checks. Real local uploads, corrupt-image recovery, source/crop controls, explicit one-photo fill, all five layouts and three grades, dragging, title/caption changes, native dialog Escape, keyboard-visible focus, five viewport widths from 320 to 1280, and actual PNGs in all three exact sizes. No JavaScript errors, failed local responses or external requests.
- `python3 tests/seven_flow.py`: 5 passed checks. Seven original fixture files with portrait, landscape, square, dark and object imagery are uploaded offline; all seven sources are assigned; replacing/cropping one leaves six unchanged; each of seven angular polygons is clicked through its real centroid; legacy switches preserve state; all seven panels at extreme crop values export verified 1920×1080, 1080×1080 and 1080×1350 PNGs offline. No page errors or external requests.
- `python3 tests/art_flow.py`: passed all five scenario groups, including 135 renderer combinations (3 sizes × 5 layouts × 3 grades × 3 treatments), extreme-aspect input, image-cache identity, empty/maximum text and independent keyboard crop. Actual exact-size PNGs were downloaded offline. A measured 720×720 preparation took 288.2 ms; 30 cached reads took 0.1 ms in that run. These timings are local diagnostics, not a production speed guarantee.
- `python3 tests/accessibility.py`: zero axe violations and 27 passed rules at each of 1280×1080 and 390×844, scoped to WCAG A/AA tags. Keyboard and native-dialog checks also passed in the main flow. No screen-reader, high-contrast mode, non-Chrome or full WCAG-conformance claim.
- `python3 tests/capture.py`: four actual final captures; three come from downloaded PNGs, scaled/JPEG-encoded only. The editor capture is an unmodified browser viewport after a real local file input. Two independent browser runs produced byte-identical full-resolution artwork PNGs in all three ratios (`cmp`); the editor screenshot status/paint timing is not claimed byte-identical.
- `MAKEFUN_OUTPUT_DIR=.qa/seven-verified-a node main.ts` and a second fresh `.qa/seven-verified-b` run: identical complete output trees by recursive `diff`.
- `node tests/audit.mjs .qa/seven-verified-a`: exact file sets and source bytes match; 19 app files / 22 entries / 2,452,316 bytes; 24 output files; JavaScript syntax and local-reference checks passed; dossier matches official reconstruction and is 1,292,677 bytes, below 1.5 MiB. Dossier SHA-256: `951ec5bbbede8640d71319863e59059111ad66cc92625f55677fbc8931c268b4`.
- Official `vendor/makefun-app.ts` matched the current kit's starter helper with `cmp`; no vendor edits. `git diff --check` passed.

Browser tests were run serially, not as concurrent heavy jobs. The app has no build step or package/runtime dependency; Python/Playwright/Pillow/axe remain QA-only outside app/.

## Screenshot manifest

| File | Pixels | Bytes |
| --- | --- | ---: |
| 01-after-hours-cover.jpg | 1280 × 720 | 223935 |
| 02-after-hours-studio.jpg | 1280 × 1080 | 252274 |
| 03-last-check-in-portrait.jpg | 864 × 1080 | 199273 |
| 04-coast-is-clear-square.jpg | 1080 × 1080 | 254464 |

All are below 262,144 bytes and meet the long-side ≤1280 / short-side ≥480 rule. `shots.json` matches these files and dimensions. Full-resolution PNGs are in `.qa/seven-final/`; the exact audited output is `.qa/seven-verified-a/`. QA, rejected assets and peer reference images are not committed.

## Actual visual comparison and review

Reviewed the real top-10 lead contact sheet, the supplied 40-image visual-breakdown context, and actual top-1/top-3/top-10 leads. A labeled five-way comparison at the same 768×480 fitting contains those three leads, this candidate and the old baseline (`.qa/seven-comparison.jpg`). No peer source or images enter the deliverable.

Compared with the baseline, this candidate visibly fixes the main correction: seven different subjects, interlocking full-bleed geometry, a dominant central face, and layered title typography rather than a three-photo postcard/ribbon layout. The review identified lower-scene obstruction and a secondary portrait under the header; the title was reduced, the header slimmed, and scene/hero crops adjusted. Hero eyes/glasses and mouth remain visible; the secondary face is visible, although the hat top is cropped. The lower skyline and water remain subordinate to the lettering.

The actual peer comparison does NOT establish superiority: leading peer covers still show stronger differentiated cast/genre signals, more saturated illustrated spectacle and more elaborate lettering. This candidate has a cleaner, setting-rich coastal collage but a less explicit crime ensemble. Those are visible tradeoffs, not a judge verdict, official score or a measured paid-boundary margin. Stars, reviews and seals in peer art were not fabricated or copied here.

Self-review covered model/geometry, all upload/selection paths, hidden legacy state, renderer/cache, source licensing, screenshot provenance and exact delivery bytes. No independent child or paid/unverified review CLI was launched; parent independent acceptance remains required. The final render was inspected separately from functional checks; no claim that Node tests prove art quality.

## Intake and authorization boundary

Live requirements on this run report strict transcripts and close at 2026-11-21 10:30 UTC (18:30 UTC+8). Read-only account status reported 0 entries, `can submit now: yes`, 5 daily slots, hard-limit remainder 40; effective total/entries-left-now remain withheld by reputation policy. This is permission observed then, not a promise that it persists.

The exact-commit kit check is separate from the above app audit. Its transcript/server/signature skips cannot prove combined sealed-recording authorship or intake eligibility. Parent handles the full genuine prior-authoring chain, current recording, instruction files, run record and independent acceptance. No submit, signature, wallet/account mutation or spending was performed. Trophy Guide is the parent's next task, not part of this checkout.
