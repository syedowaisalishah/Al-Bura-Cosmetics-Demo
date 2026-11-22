# Phase 2 delivery and verification

Historical Phase 2 snapshot, verified 2026-11-22 (Asia/Karachi). The educational
guide is now implemented in Phase 3; see [PHASE_3_REPORT.md](PHASE_3_REPORT.md).
Phase 2 implemented the photo hair try-on;
Window 2 chemical advice, a database/admin service, and live camera remain deferred.

## Working features

- Real JPG/JPEG/PNG/WebP upload and drag/drop, replace, reset, and retry.
- MIME/extension and 15 MB file validation, orientation-aware browser decoding,
  aspect-preserving downscale to at most 1024 px. The prepared original appears
  before model initialization completes. No original photo is uploaded.
- Official MediaPipe IMAGE-mode CPU inference in a browser worker; both models
  load once per studio session. Failed initialization can be retried.
- Hair-only and multiclass hair confidence agreement, conservative skin exclusion,
  pixel-centre bilinear mask alignment, tiny-region removal, and inward feathering.
- Cached original pixels, mask, CIELAB channels, and weighted hair statistics.
  All twelve illustrative shades work without repeating segmentation.
- D65 CIELAB recolouring: monotonic bounded luminance shift, retained local
  luminance differences, residual chroma detail, bounded target chroma, reduced
  chroma in deep shadows and highlights, and feathered alpha blending.
- Before/after pointer drag, touch, keyboard-accessible range, and PNG download of
  the actual processed pixels. Mask debugging is available only in development.
- Loading, processing, rendering, no-hair, decoding and model-failure states.
  Obsolete renders are aborted and cannot replace a more recent result. Download
  is disabled until the current shade is ready. Reset revokes all image URLs.

`intensity` defaults to 0.88 in `hair-recolor.ts`; this is an internal rendering
parameter. Extreme lightening/darkening is bounded to retain detail. The preview
is an illustration, not a prediction of chemical lift or actual dye results.

## Real model verification

The original HairSegmenter detected real hair but also misclassified bright
outdoor trees in a backlit blonde test photo. We added Google's official
`selfie_multiclass_256x256` as a second model, without replacing the required hair
model or drawing a manual mask. Each image runs both models once; pixels must
have hair confidence in both, with a skin-probability exclusion around face/body
boundaries. This removed the observed background false positive.

Both models use Tasks Vision 1.2.3, CPU, WASM, and IMAGE mode. Their SHA-256,
TFL3 header, float32 tensor types, shapes, and packed `labels.txt` were independently
checked. Runtime labels are also checked before use. Hair is category index 1 in
both models. Model sources, licenses, model cards, and checksums are recorded in
[`public/models/README.md`](../public/models/README.md).

## Automated and browser checks

- Seven `npm test` regression checks cover reference CIELAB values/round trips,
  asymmetric mask alignment, speck removal, feathering, skin exclusion,
  byte-identical non-hair RGBA pixels, retained luminance ordering, original image
  immutability, zero strength, cancellation, no-hair and upload validation.
- TypeScript (`npm run typecheck`) and ESLint (`npm run lint`) pass.
- Clean `npm ci --ignore-scripts=false` passed, generated local WASM/worker assets,
  and reported zero vulnerabilities. `npm run build` passed and exported both
  routes. Next.js confirmed it loaded the real local `.env`.
- Chrome 151 on this Linux laptop exercised actual upload and worker inference.
  Three real portraits covered dark hair with a blue/purple studio background,
  brown hair outdoors, and backlit blonde hair with trees/buildings.
- Pixel-level checks over the whole images found **zero changed pixels outside
  the refined mask**, **zero changed alpha bytes**, and **zero changes in sampled
  face-interior and background regions** for all three photos. Sampling does not
  prove that every face/background pixel is always classified correctly.
- Correlation between original and recoloured hair luminance was 0.992 (dark),
  0.976 (brown), and 0.994 (blonde), with visible retained texture in reviewed PNGs.
- Dual-model inference took about 0.60–1.07 seconds; cached copper recolouring
  about 0.16–0.19 seconds for those prepared images. Times depend on hardware,
  browser, and cache state; these are local observations, not guarantees.
- All twelve palette entries produced different processed images while the
  inference count remained one photo analysis. Rapid shade switching ended on
  the final selected shade with one selection active.
- Mouse drag, ArrowLeft keyboard input, and emulated mobile touch moved the
  comparison position correctly. The 390 px mobile layout had no overflow.
- Downloaded PNG signature and SHA-256 matched the current result object URL.
- An EXIF orientation-6 portrait decoded upright at 683 × 1024.
- Reset during processing left no photo, result, or retained object URLs. A
  uniform image produced a no-hair error and disabled download. An intentionally
  blocked model request produced a clear error; retry succeeded after unblocking.
- No uncaught application exceptions or external photo/network requests were
  observed in the normal UI checks. The SDK emits native diagnostic warnings;
  its exact informational XNNPACK delegate line is classified as `console.info`
  in the worker. Actual model errors remain errors and are surfaced to the user.
- The final production export repeated the real three-photo UI checks, rapid
  palette changes, mouse/keyboard/touch comparison, download byte equality,
  no-hair handling and reset cancellation successfully. A separate attached
  worker/page console check found zero console errors/uncaught exceptions, and
  confirmed that the development mask toggle was absent in production.

Browser QA scripts, downloaded photos and temporary renders live outside the
repository, not in the website. Fixtures were obtained from these Unsplash image
endpoints for local testing only:

- Dark: https://images.unsplash.com/photo-1534528741775-53994a69daeb
- Brown: https://images.unsplash.com/photo-1544005313-94ddf0286df2
- Blonde: https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43

## Publication status

The complete Phase 2 production export is ready locally in `out/` and serves
the homepage, studio and worker with HTTP 200. The existing Sites project remains
`appgprj_6b02180d4a288191892e8de2e47bc7cb`; its identity was preserved.
When renewing the expired source credential, the hosting connector returned
`Sites project not found` (`project_not_found`, HTTP 404). A subsequent `get_site`
returned the same error. Phase 2 therefore **has not been published** to the
earlier hosted URL. No replacement Site or sharing change was made.

## Limitations and deferred features

Fine flyaways, transparent strands, face-crossing locks, braids, headwear, distant
subjects, low light, and background textures can still be missed or misclassified.
Requiring model agreement and excluding skin trades some edge coverage for fewer
skin/background edits. Mixed lighting and extreme shade changes can look less
natural. There are no hand-labelled masks or broad accuracy benchmarks in this
delivery, and real mobile Safari/Firefox testing is pending.

No live camera, chemical formulas, developer strengths, guide calculations,
admin dashboard, backend, or database was added. The illustrative shade data has
not become a brand-approved Al Bura card; the scope PDF is still absent.

## Files changed

- `src/lib/ai/mediapipe.ts`, `hair-segmentation.ts`, `mask-utils.ts`,
  `hair-recolor.ts`: actual worker client, model inference, refinement and colour.
- New `src/lib/ai/segmentation.worker.ts`, `photo-utils.ts`, and
  `src/types/vision-worker.ts`; extended `src/types/try-on.ts`.
- `src/lib/color/color-utils.ts`: sRGB/XYZ/D65 CIELAB conversion.
- Existing `HairTryOn`, `PhotoUploader`, `BeforeAfterSlider`, `ShadePalette`
  components: functional UI. Shared page copy/theme updated in `src/app`.
- Model verification/download and asset sync scripts now validate both real models
  and generate the local worker. `esbuild` is an explicit development dependency;
  no paid APIs, cloud inference, or heavy vision framework was installed.
- New official multiclass model and model card in `public/models`, plus provenance.
- New `tests/vision.test.ts`, updated documentation, package scripts and lockfile.
- Private `.env` created in the app root (mode 600, ignored by Git); `.env.example`
  removed. Model paths/debug flags are public build configuration, not secrets.
  This client-only application requires **no secret credentials**. Never put a
  real secret in a `NEXT_PUBLIC_` variable or in exported static assets.
