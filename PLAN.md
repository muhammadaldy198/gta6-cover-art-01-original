# After Hours — recorded build plan

Build a static, offline photo-cover studio with no application dependencies. The existing kit samples and unchanged dossier helper are the only inherited content. All app code and the Node entrypoint will be authored in this recording.

## Direction

A midnight crime-dossier cover: one large hero photograph, two angled supporting snapshots, a diagonal coral/gold title ribbon and a small illustrated motel-key stamp. Restrained paper details, original typography treatment and intentional empty space distinguish it from dense sunset collages. Palette: midnight #101d29, ink #07121c, paper #fff2d5, coral #ff735b, gold #ffc566, sea-glass #71d4cc. Locally bundled, licensed Liberation Sans for interface and condensed canvas title treatment. No game logos, artwork or fonts.

## Bounded sequence and checks

1. RED/GREEN: pure crop math and panel-layout tests, then implement the geometry module. Crops must cover without blank edges at every pan/zoom and output ratio.
2. RED/GREEN: browser smoke test for three loaded panels, independent photo/crop state, live caption, layouts/grades, sizes and actual PNG downloads; then implement the renderer and editor. Keep normal controls available; deterministic query parameters are only initial state.
3. Real Chrome QA: upload both kit files through file input; test one-photo fill, sample reset, text limits, invalid file recovery, keyboard focus, responsive overflow, pointer dragging and all three output dimensions. Monitor requests and console errors.
4. Capture four fresh images from the actual canvas/editor, inspect full-size and thumbnail. First screenshot is the landscape exported cover. Keep all images within 256 KiB and dimension limits.
5. Audit local references and fonts; run entrypoint twice and compare every output byte; compare vendor helper and license to baseline; inspect dossier, git diff and screenshot manifest. Commit on main, push and verify remote SHA. No account mutation, wallet use, signature or submission.

## Evidence boundaries

The local contact sheet is used only for broad hierarchy/readability criteria, never as a source of code, assets or copied layout. Local verification cannot establish a server score or paid placement. The parent owns recording seal/provenance checks and submission eligibility.
