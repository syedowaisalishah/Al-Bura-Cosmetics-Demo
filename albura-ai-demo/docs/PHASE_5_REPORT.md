# Phase 5 — Final demo audit and verification

A subsequent [edge coverage correction](EDGE_COVERAGE_FIX.md) recovers connected
lower curls missed by strict model intersection; that report contains the newer
mask coverage and 36-test results. The measurements below record Phase 5.

Completed locally on 2026-11-22 (Asia/Karachi). This report covers the final
stabilization work; earlier Phase 2–4/camera-capture changes also remain in the
working tree. The project was extended in place with no new dependencies,
models, paid AI, infrastructure, backend, database or framework.

## Audit and implemented features

Inspected the actual routes, upload/capture components, worker protocol/model
factories, native mask extraction/refinement, recolour engine, validated shade
JSON, shared Context, guide rules/inputs/locks, CSS, build scripts and static
hosting setup. The working architecture is a client-only static Next.js export.

The app provides:

- Upload/replace/reset with validation and orientation-aware browser decoding.
- Normal getUserMedia preview, Capture Photo, Retake, Stop, optional selfie
  mirroring and camera errors. Capture stops tracks and reuses the exact upload
  IMAGE pipeline. There is no continuous inference, video recolouring or FPS UI.
- Real dual-model hair segmentation, conservative skin exclusion, aligned mask
  resizing, connected noise removal and small inward feathering. Background
  support is never expanded by edge smoothing.
- Cached texture-preserving photo recolouring and twelve illustrative shades.
  Search/family filters, code/name/HEX/family/level/reflection details, clear
  selected state, original/compare/preview views and processed PNG download.
- Shared Window 1/Window 2 shade state, manual natural level/history/grey/length/
  density inputs, derived lift assessment, pigment/reflection references, safety
  warnings, explicit technical-approval locks and portrait-free printing.
- Desktop side-by-side windows, mobile tabs, first-time instructions, local
  privacy messaging, loading/error/retry states and responsive result controls.

## Fixed issues and colour improvements

1. **Over-bright red/pink diffuse strands:** a whole-hair mean can be dominated by
   deep shadows. The colour cache now also computes a weighted 85th-percentile
   lightness anchor, bounded relative to the mean. The mapping uses that upper
   tone rather than brightening highlights to compensate for shadowed hair.
2. **Tinted highlights / flat colour:** bounded monotonic lightness mapping,
   retained local chroma variation and reduced tint/lightness shift in bright
   specular reflections preserve more strand detail. Saturation is capped.
3. **Out-of-gamut clipping:** new CIELAB-to-sRGB gamut fitting reduces chroma while
   preserving lightness/hue, instead of independently clipping RGB channels.
4. **Unnecessary colour work:** compact cached hair indices/Lab values limit
   subsequent shade loops to active hair. Original RGBA is copied unchanged;
   no colour conversion occurs for zero-mask pixels. Chunk yielding/cancellation
   are retained. Re-selecting a shade does not accumulate colour from a result.
5. **Malformed native masks:** category/skin dimensions, array lengths and finite
   skin probabilities are validated before blending. Invalid native results fail
   visibly and close their MediaPipe resources.
6. **Inherited comparison position:** replacing/capturing a new photo now resets
   its comparison to 50/50, even if the previous photo was left at Original.
7. **Narrow result controls:** flexible wrapping, bounded non-cropped image
   containers, mobile text sizing and 44 px comparison/filter actions improve
   use at narrow widths. Camera results have a directly visible Reset action.
8. **Discoverability:** first-time steps, quick comparison views, richer shade
   metadata, search/family filters and clear empty/reset states were added.

No perfect segmentation, exact shade match or real dye simulation is claimed.
The existing conservative edge policy was retained instead of increasing blur
or spreading the mask onto face/background. Glasses/occlusion require further
annotated-image evaluation; there is no universal accessory-preservation claim.

## Model and pixel evidence

The unchanged MediaPipe Tasks Vision 1.2.3 SDK uses **IMAGE mode**. Runtime label
validation and artifact verification establish hair index 1:

| Existing official Google model | Labels | Verified SHA-256 |
| --- | --- | --- |
| Hair segmenter float32 v1, 781,618 bytes | background, hair | `2628cf3ce5f695f604cbea2841e00befcaa3624bf80caf3664bef2656d59bf84` |
| Selfie multiclass 256 float32 v1, 16,371,837 bytes | background, hair, body-skin, face-skin, clothes, others | `c6748b1253a99067ef71f7e26ca71096cd449baefa8f101900ea23016507e0e0` |

Native probabilities are copied before closing, clamped to [0,1], independently
resized in X/Y by pixel centres and combined by hair agreement plus explicit
skin exclusion. Native/processed mask shapes were checked on real source images.

Real-model Chrome QA processed dark, brown and blonde portrait fixtures, each
with Cocoa Brown, Burgundy, Ash Blonde and Warm Copper (12 transformations).
Before/after renders were inspected by the assistant, including a contact sheet.
This was visual review of automated outputs, not a physical camera/manual user
acceptance session or an annotated accuracy benchmark.

- Hair regions: 30,127 / 106,290 / 35,095 pixels respectively.
- **Zero changed RGB pixels outside the refined mask**, zero alpha changes,
  and zero changes in the sampled face and top-background regions across all 12.
- Source/output luminance correlation inside high-confidence hair was
  approximately **0.956–0.9999**. This measures contrast retention on these samples,
  not perceptual colour accuracy or segmentation precision/recall.
- Local test inference was about **612–828 ms/photo**, with cached recolour loops
  about **54–188 ms** before PNG encoding. These headless CPU observations depend
  on hardware/load and are not a performance guarantee.
- Both model instances were reused within the photo session. No fabricated
  segmentation mask or fake recoloured UI output was used.

Test fixtures, camera recordings, before/after experiments and screenshots live
under `/tmp/albura-phase5`, outside source and deployment output.

## Checks and end-to-end tests

Environment: Ubuntu 26.04, Node 22.22.1, npm 9.2, Chrome 151 headless. Browser
checks use the production `out/` export at localhost:3002. Camera input is a
virtual webcam repeating a real portrait; injected camera API errors exercise
permission/missing/busy UI paths. Physical desktop/mobile devices and native
permission dialogs were not tested.

- `npm test`: **34/34 PASS** (guide boundaries and all 300 valid level/history
  combinations; mask alignment/noise/skin protection; colour round trips,
  gamut/contrast/highlights/shadow bias/cache immutability; metadata/filtering;
  camera cleanup and native IMAGE result ownership).
- `npm run typecheck`: **PASS**.
- `npm run lint`: **PASS**, zero warnings.
- Model hashes/structure/labels/shapes: **PASS** during prebuild.
- `npm run build`: **PASS**, static `/` and `/try-on/` routes exported.
- Production camera regression: **PASS**. Zero workers/inference while framing;
  tracks ended before IMAGE processing; one analysis per capture; three distinct
  shade results with count unchanged; mirror pixels matched the preview;
  before/after, PNG hash, retake, upload, Window 2 sync, mobile hiding, delayed
  permission, errors and full URL/stream/worker teardown passed. No page errors
  or external photo/frame requests occurred.

- Production photo regression: **PASS**. Brown/dark/blonde uploads, rapid shade
  changes without another analysis, mouse/keyboard/mobile-touch comparison,
  download SHA-256/signature, invalid input, no-hair error, reset/cancellation and
  URL cleanup passed. No uncaught errors or external requests.
- Production guide regression: **PASS**. Lift/history scenarios, immediate shade
  details/reflection/target sync, guide-only changes without photo recolour or
  reinference, mobile keyboard tabs/deep link and print/PDF approval notices passed.
- Shade/filter/error checks: **PASS**. Case-insensitive multiword/code/HEX search,
  combined family/empty/clear states, retained selected shade, all comparison
  views and 50/50 reset on photo replacement. A real missing-model 404 displayed
  the actual failure; restoring the valid model and Retry preview succeeded.
- Responsive metrics: **PASS** at 320, 390, 760, 850, 1024 and 1440 px. No
  horizontal overflow; images use `contain` with a 650 px height cap. Result
  actions remain at least 44 px high and search input text is 16 px.
- Static asset/route audit: **51/51 HTTP checks PASS**, including homepage/studio,
  all exported assets, worker, both models and WASM. WASM is served as
  `application/wasm`; an unknown route returns 404. The export has no `.env`,
  test source, node_modules or source-photo fixtures.
- Native EXIF orientation: **PASS**, the rotated JPEG decoded to a 683×1024
  portrait. All twelve shades then processed with one analysis and synchronized
  selection/Window 2 details.
- Page and attached worker runtime logs: **PASS**, no errors on a production
  photo flow; development mask controls are absent from the export.
- Final mobile/desktop screenshots were inspected; the mobile instructions are
  compact and the palette/result controls remain readable and usable.
- Vercel configuration: JSON/build/output/engine-lock consistency checks passed.
  The exported site's HTML asset references resolve. Actual Vercel hosting,
  headers and HTTPS camera permission remain undeployed verification steps.

## Modified files for Phase 5

| Files | Purpose |
| --- | --- |
| `src/lib/ai/hair-recolor.ts` | Active hair cache, bounded tone anchor, highlight/chroma protection |
| `src/lib/color/color-utils.ts` | Hue/lightness-preserving gamut fitting |
| `src/lib/ai/hair-segmentation.ts` | Strict native mask validation |
| `src/lib/color/shade-filter.ts` | Pure multiword/family filtering |
| `src/components/try-on/ShadePalette.tsx` | Search, family filters, metadata, selected marker and empty state |
| `src/components/try-on/BeforeAfterSlider.tsx` | Original / Compare / Colour preview actions |
| `src/components/try-on/HairTryOn.tsx` | Comparison reset, busy state, camera-mode Reset |
| `src/components/try-on/PhotoUploader.tsx` | Remove redundant hidden-input keyboard stop |
| `src/components/try-on/TryOnStudio.tsx` | First-time instructions |
| `src/app/studio.css`, `src/app/layout.tsx` | Final typography, control, card, image and responsive polish |
| `tests/vision.test.ts`, `tests/camera.test.ts`, `tests/shades.test.ts` | Focused colour, mask, capture and shade regression coverage |
| `vercel.json`, `.vercelignore`, `package.json`, `package-lock.json` | Static deployment commands/output, excludes and Node 22.x |
| Root/app README, `docs/DEMO_GUIDE.md`, `docs/KNOWN_LIMITATIONS.md` | Run/deploy instructions, three-minute script and honest limits |
| `docs/ARCHITECTURE.md`, `SETUP.md`, `IMPLEMENTATION_PLAN.md`, this report | Current internals, scope and verification |

The existing `.gitignore` already excludes `.env*`, dependencies, build output,
Vercel linkage and generated workers/WASM. It was retained. The real `.env`
remains private, Git-ignored, permission 600; no secret is shipped or committed.

## Local operation, deployment and production work

```bash
cd albura-ai-demo
npm ci
npm run dev
```

Open http://127.0.0.1:3000/try-on/. `npm run build && npm start` previews the static
export. Use a different `PORT` if needed. Camera access needs localhost or HTTPS.

Vercel deployment is **prepared, not performed**: no credentials, linked project
or CLI account were available. The README gives exact Git import/root-directory,
Node 22.x, Other preset, `npm ci`, `npm run build`, `out`, environment and HTTPS
checks. The Vercel settings are static; no unnecessary server routes exist.
Hobby is restricted to personal non-commercial use; do not assume a company
pitch/client project qualifies. No paid plan, trial, add-on or service is enabled.
The verified static export is also archived locally at
`/tmp/albura-phase5/albura-phase5-static.tar.gz` (26,333,698 bytes), with no
private `.env`, source photos or camera recording. This archive is not a deployment.
[Vercel fair-use rules](https://vercel.com/docs/limits/fair-use-guidelines).

Remaining production work: official 180-shade/Lab data and technical-team approval;
annotated model evaluation across hair, skin, accessories and backgrounds;
physical mobile/desktop/browser tests; accessibility/performance/security/privacy
review; hosting eligibility and brand sign-off. No production database/admin,
authentication or chemical formulation feature is implemented. See
[KNOWN_LIMITATIONS](KNOWN_LIMITATIONS.md) and [DEMO_GUIDE](DEMO_GUIDE.md).
