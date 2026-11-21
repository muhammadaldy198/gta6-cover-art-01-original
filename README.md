# After Hours — independent cover studio

[![make.fun competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/muhammadaldy198/gta6-cover-art-01-original/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/muhammadaldy198/gta6-cover-art-01-original/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A private, offline photo-to-cover-art maker. Seven independently editable, interlocking scenes around one dominant portrait, printed-ink treatment and a layered title across the seams. No game logos, official artwork, characters or game fonts. Optional three-panel layouts remain available.

![A landscape cover exported by the actual app](screenshots/01-after-hours-cover.jpg)

## Use it

Run `node serve.ts` with Node 22.18 or newer. Open `http://localhost:8080` in desktop Chrome. No install, build step, account or API key is needed.

1. Start with seven different local demo images, or choose **Add your photos**. JPG, PNG, WebP and AVIF images are decoded on your device; nothing is uploaded. Select up to seven files together to replace the seven panels in order, starting at the selected panel. The tray holds up to 24 images, each under 25 MB.
2. Select Hero, Connection, Car, City, Palms, Motel or Water. Assign any photo, drag within a panel, or use its zoom and horizontal/vertical sliders. These are suggested scene roles, not restrictions. One photo fills all seven panels only when you explicitly choose that action; every crop stays independent.
3. Edit the title, caption, location and edition. Try five layouts, three color grades, illustrated ink/screen print/cinematic photo, and clean/printed texture. **Coral hour** warms highlights; **Neon tide** casts rose and violet into the photographs. Hidden crops survive switches to three-panel layouts.
4. Choose landscape 1920 × 1080, square 1080 × 1080 or portrait 1080 × 1350. **Export PNG** downloads the exact preview at full resolution. The confirmation says when the PNG is ready and the download has started.

The live canvas and exported PNG use the same renderer. `View cover only` opens a native, keyboard-dismissable dialog. Inputs have visible keyboard focus and the layout works down to 320 CSS pixels without horizontal page overflow.

All scripts, images and fonts used by the application live under `app/`. The badges in this README are not application resources and do not load when the editor runs. No dependencies are shipped or required by the app or entrypoint.

## Deliverable

`main.ts` copies `app/` and `screenshots/` to `MAKEFUN_OUTPUT_DIR` (default `/output`) and writes `dossier.json` with the unchanged official `vendor/makefun-app.ts` helper. It rejects a screenshot directory that does not contain three or four PNG/JPEG files.

```
MAKEFUN_OUTPUT_DIR=.qa/output-a node main.ts
MAKEFUN_OUTPUT_DIR=.qa/output-b node main.ts
diff -r .qa/output-a .qa/output-b
cmp .qa/output-a/dossier.json .qa/output-b/dossier.json
node tests/audit.mjs .qa/output-a
git diff --check
```

Screenshots are four images produced by `tests/capture.py`: three actual downloaded PNGs, only scaled and JPEG-encoded within the competition limits, and one unaltered 1280 × 1080 browser capture with the cover, seven panel controls and export button visible. Each showcased cover uses seven different sources, never a duplicate crop as a filler panel. The audit compares the output app and screenshot bytes with their sources before rebuilding the dossier. Full-resolution originals and test evidence remain locally under ignored `.qa/`.

## Verification

The application has no test dependency. Browser QA tooling is separate and not delivered in `app/`:

```
python3 -m pip install --target .qa/python playwright --break-system-packages
npm install --prefix .qa/axe axe-core --ignore-scripts --no-audit --no-fund
node --test tests/*.test.mjs
python3 tests/browser_smoke.py
python3 tests/browser_flow.py
python3 tests/seven_flow.py
python3 tests/art_flow.py
python3 tests/accessibility.py
python3 tests/capture.py
```

Python QA also uses Pillow, and launches the installed `/usr/bin/google-chrome` headlessly. Start `node serve.ts` before browser checks. The flow checks real local file input, corrupt-file recovery, crop independence, dragging, all layouts and grades, downloads at all three dimensions, keyboard focus, dialog Escape, offline operation, local resource responses and five responsive viewport widths. Axe is loaded only by the test runner, never by the app. Automated checks are not a claim of complete assistive-technology coverage.

## Assets and license

- App code: MIT, root `LICENSE` unchanged from kit.
- `app/samples/boulevard.jpg` and `pier.jpg`: official make.fun sample images, AI-generated fictional people and free to use under the kit rules. Each appears once in the demo.
- `app/samples/motel.svg`: original vector illustration authored for this app, MIT. It is not a photograph or an image-model output. Its sign says After Hours, not a real business.
- Four CC0 photographs below are bundled locally, resized and JPEG-encoded; the renderer applies its chosen color treatment. Their actual locations are source metadata, not a claim that every scene depicts the fictional Palm Coast setting. CC0 permits redistribution and adaptation: https://creativecommons.org/publicdomain/zero/1.0/ . No identifiable people are visible in these four supporting images. Car badges are incidental to the photographed object, not app branding or an endorsement.
- `app/fonts/LiberationSans-*.ttf`: unmodified Liberation Sans, SIL Open Font License 1.1; copyright and full license accompany the files in `app/fonts/LICENSE.txt`. No game font files are used.
- `vendor/makefun-app.ts`: unchanged official kit helper.

| Local file | Creator and subject | Verified license/source page | Downloaded source |
| --- | --- | --- | --- |
| `riviera.jpg` | Joe deSousa / Mustang Joe; 1963 Buick Riviera, Toronto auto show | [Commons CC0, Flickr review](https://commons.wikimedia.org/wiki/File:1963_Buick_Riviera_(25152254301).jpg) | [Flickr photograph](https://www.flickr.com/photos/mustangjoe/25152254301/) |
| `skyline.jpg` | Joe deSousa; Miami waterfront, 2019 | [Commons CC0](https://commons.wikimedia.org/wiki/File:Miami,_Florida_(2019).jpg) | [Flickr original composition](https://www.flickr.com/photos/mustangjoe/39886682813/) |
| `palms.jpg` | Klara Sasova; coconut crown, Barcelona | [Commons CC0, published before Unsplash's June 2017 license change](https://commons.wikimedia.org/wiki/File:Coconut_tree_in_Barcelona_(Unsplash).jpg) | [Original photo page](https://unsplash.com/photos/nrfSpR3_4yE) |
| `boat.jpg` | safaritravelplus; sailing boat at sunset, Zanzibar | [Commons CC0 with license review](https://commons.wikimedia.org/wiki/File:Zanzibar_Sunset_Boat.jpg) | [Photographer's image page](https://www.safaritravelplus.com/images/cities/dhow-zanzibar/) |

Wikimedia image delivery returned HTTP 429/403 during sourcing. The same CC0 photographs were downloaded from their original Flickr/Unsplash/photographer sources, not from peer entries. A second car photo containing people was inspected and rejected; it is not delivered. The motel illustration replaced that slot. Peer cover images were reviewed only outside the repository deliverable; no peer code or image is bundled.

See [local verification](VERIFICATION.md) for results and limits. No server score, submission or paid placement is claimed.
