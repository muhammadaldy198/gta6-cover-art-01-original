# Local verification — After Hours

This is a locally verified candidate, not a submission or a competitive score.

## Executed checks

- `node --test tests/geometry.test.mjs`: 2 tests pass, 0 fail. Covers 324 crop/pan/zoom combinations plus three panel layouts at all three required output ratios. The detail-panel regression requires its frame to sit above the title ribbon.
- `python3 tests/browser_smoke.py`: real three-panel editor loads and downloads a PNG.
- `python3 tests/browser_flow.py`: 13 checks pass. Real local multi-file upload while offline, corrupt-image recovery, live title/caption changes, independent crops, one-photo fill, crop reset, all layout/grade combinations, pointer drag, all three exact PNG output dimensions, dialog Escape, visible keyboard focus, five viewport widths (1280, 1024, 760, 390 and 320 CSS pixels), no external requests, no failed local resources and no JavaScript errors.
- `python3 tests/accessibility.py`: axe WCAG 2 A/AA, 2.1 AA and 2.2 AA tags; 26 checks passed and zero reported violations at each of 1280×1080 and 390×844. Not a claim of complete WCAG or screen-reader conformance.
- `python3 tests/capture.py`: four fresh screenshots, three originating as real PNG downloads through the export button and one unmodified browser screenshot. Full-size and thumbnail visual checks confirm readable titles/captions, complete portrait faces, intentional car-detail crops and an unclipped editor.
- `MAKEFUN_OUTPUT_DIR=.qa/output-a node main.ts` and `MAKEFUN_OUTPUT_DIR=.qa/output-b node main.ts`: both exit 0 with `After Hours: static app, 4 screenshots, deterministic dossier.`
- `diff -r .qa/output-a .qa/output-b` and `cmp .qa/output-a/dossier.json .qa/output-b/dossier.json`: exit 0, no differences.
- `node tests/audit.mjs`: 12 app files, 15 app entries, 1,395,421 app bytes; 11 local references resolve. No remote/CDN/package references or network APIs in the reachable source. All JS modules parse. 17 output files, dossier 1,202,748 bytes, exact match to independent `buildDossier` reconstruction. Output files are world-readable.
- `git diff --check`: exit 0.
- `sha256sum vendor/makefun-app.ts <kit>/starter/vendor/makefun-app.ts`: both `14e650adbd6aff7fb760e9bcd7be00dfbe86fb4819afe88dfe23dd0e087e770e`. Root MIT LICENSE unchanged.

## Screenshot manifest

| File | Dimensions | Bytes |
| --- | --- | ---: |
| 01-after-hours-cover.jpg | 1280 × 720 | 207830 |
| 02-after-hours-studio.jpg | 1280 × 1080 | 232629 |
| 03-last-check-in-portrait.jpg | 864 × 1080 | 214901 |
| 04-neon-alibi-square.jpg | 1080 × 1080 | 217704 |

Every file is below 262144 bytes, long side at most 1280, short side at least 480. Only the two AI-generated official kit sample photos appear. Full PNG downloads, manifests and test reports remain under ignored `.qa/` for independent parent inspection.

## Scope and remaining checks

No make.fun submission, account change, wallet access or signature was performed. No external model-generated artwork or peer source/assets were used. The parent contact sheet informed only broad hierarchy/readability criteria. Server intake, witnessed recording seal, run-record/parent-chain provenance, public-repository metadata, comparative paid-boundary review and any submission remain the parent's responsibility. Chrome is the exercised browser; no claim is made for untested browsers or manual screen-reader behavior.
