# Three-mode hair try-on — 2026-11-23

Upload Photo, Live AI Camera (Experimental), and Take Photo (recommended) are
available together. Camera capture keeps its existing component and shared
still-image pipeline. No models, runtime dependencies, paid APIs or backend
services were added. Vercel still serves the static browser-only export.

## Working behaviour

- **Upload Photo:** the original IMAGE worker runs both existing verified models
  once per photo. A refined mask, immutable original and compact Lab cache serve
  subsequent shade changes, comparison and PNG download.
- **Experimental Live Preview:** starts only on explicit camera permission. A
  separate worker holds a fixed VIDEO pair and calls `segmentForVideo` with
  strictly increasing millisecond timestamps. It copies native masks inside
  their callback lifetime, then uses the same hair/skin evidence, edge refinement
  and texture-preserving CIELAB colour engine as photos. Native video and the
  processed canvas share aspect ratio and selfie orientation. Show original
  exposes the untouched video. The output canvas contains the exact frame its
  mask analysed, avoiding an old mask painted onto a newer moving frame.
- **Take Photo:** Open Camera shows normal video without live inference. Capture
  freezes the raw frame, mirrors it consistently, stops all tracks and passes a
  local PNG File to the existing `HairTryOn.processPhoto`. The live-mode Take
  Photo shortcut also reads raw video, never the recoloured canvas. The IMAGE
  pipeline runs once; shades, before/after and download reuse its cache.
- **Shared shade:** all three modes and Window 2 use the existing Context and
  palette. Still results remain mounted while live is selected, without hidden
  recolouring work. Leaving live reapplies the current shade from the still cache
  without another IMAGE inference. Guide-only input changes do not trigger AI.
- **Cleanup:** Stop, mode changes, mobile guide switches, page hiding and route
  teardown release streams, workers, animation frames and transferred bitmaps.
  Session guards stop late permission responses and discard cancelled/stale
  frames. Existing original/result object URL ownership remains in HairTryOn.
  Camera failures keep the previous photo and upload path available.

## Performance and visual changes

The earlier low FPS report was about 1.9 FPS. This is not a controlled baseline
for the new measurements below. The prior path used CPU inference for both
models and photo-oriented work on each frame. The photo renderer deliberately
pauses between chunks; those timer pauses are unnecessary inside a live worker.

The restored implementation:

- Allows only one awaited frame, including bitmap creation, inference and colour
  rendering. Both client and worker reject overlap. It skips unchanged video
  timestamps and caps starts at eight per second; the displayed FPS counts actual
  completed frames over elapsed time, rather than advertising that cap.
- Starts within a 320 × 240 processing box, then backs off to 256 × 192 and
  192 × 144 only after sustained slow pixel/transfer work, preserving source
  aspect ratio. Model/extraction time is excluded from the backoff metric: input
  downscaling cannot reduce the fixed 512/256 tensor sizes and should not blur
  the preview merely because inference is slow.
- Reuses active-hair Lab/index/output buffers and disables chunk timer yields
  only in the live worker. Default still-image maths and responsive yielding
  remain intact; unit tests verify equivalent colour output with reused buffers.
- Uses current hair support as the limit of temporal mask smoothing. Newly
  excluded skin/background cannot inherit colour from the previous mask. Empty
  scenes, substantial scene changes, resolution changes and time gaps reset
  mask history. Only global source colour statistics are smoothed; strand pixels
  are never blurred. No flat colour fill or generated mask is used.
- Reuses bounded lightness mapping, highlight protection, source chroma detail,
  saturation limits, skin exclusion and the connected-curl recovery fix already
  present in the photo engine. Pixels with zero mask alpha retain their original
  RGBA values. This cannot correct every semantic segmentation error.
- Offers Automatic, CPU and GPU while stopped. Auto tries hardware GPU, uses CPU
  for known software renderers, and retries with a fresh CPU worker if GPU setup
  or a GPU frame fails. The IMAGE singleton is never reconfigured. Explicit GPU
  permits testing software rendering too. Slow measured FPS displays a Take
  Photo recommendation; the capture path remains available during AI loading.

## Actual CPU versus GPU measurements

Chrome 151 headless on Linux, local real 592 × 360 curly-hair portrait, real
installed MediaPipe 1.2.3 and both existing models. The renderer was **ANGLE /
Vulkan SwiftShader**, a software GPU implementation. These numbers do **not**
measure a physical GPU. CPU and explicit GPU were tested sequentially with the
same 320 × 195 canvas, two warm-up frames and eight timed frames. No AI masks or
inference results were mocked.

| Mean after warm-up | CPU | GPU delegate, software renderer |
| --- | ---: | ---: |
| Both models + owned mask extraction/fusion | 242.6 ms | 1488.7 ms |
| Refinement and temporal mask | 3.2 ms | 4.1 ms |
| Cache preparation and recolouring | 4.0 ms | 4.3 ms |
| Round trip including bitmap and test readback | 252.1 ms | 1499.6 ms |
| Sequential test throughput | 3.97 frames/s | 0.67 frames/s |

The initial GPU frame took about 5.1 seconds versus 0.42 seconds on CPU, despite
fast model initialization. Chrome logged GPU readback stalls. This motivated
preferring CPU for detected software renderers instead of treating any WebGL2
context as hardware acceleration. On the production UI, a virtual 640 × 480
camera using real portrait frames displayed **3.3 measured FPS** at 320 × 240
with automatic CPU fallback. A prior 3.8 FPS sample at lower resolution
confirmed that sacrificing detail brought little benefit; the final policy
excludes model time from resolution backoff. Take Photo remains recommended. Physical
GPU and device performance may differ substantially.

Both delegates changed hair pixels across three shades, left the sampled face
and far-background patches unchanged, produced different outputs for different
shades, rejected overlapping calls, and returned an exactly unchanged grey
frame with zero detected hair after a portrait. These are fixture checks, not a
universal segmentation-accuracy guarantee.

## Validation

`PATH=/usr/bin:/bin npm run deploy:check` passed under Node **22.22.1**:

- TypeScript, ESLint with zero warnings, and **42 tests**.
- Tests include VIDEO callback ownership/timestamps, aspect-ratio limits,
  sustained slow-frame backoff, mask reset/no-ghost behaviour and reused-buffer
  colour parity, alongside all existing photo, camera, shade and guide tests.
- Production `npm run build` passed. The postbuild check verified 50 export files,
  both original model hashes, two bundled workers and four matching SDK runtime
  files, and checked that private env/source directories were absent.

Production Chrome automation passed **45 workflow checks** using a virtual
webcam with real portrait pixels and native models:

- All three accessible mode tabs and keyboard navigation.
- Upload IMAGE inference once; Burgundy, Warm Copper and Ash Blonde changes
  reuse its mask. Original/Compare/Colour preview controls work.
- Live hair detection, three live shade changes, Window 2 synchronization,
  measured FPS, software-GPU → CPU fallback, original toggle and no overlap.
- Hidden still result remains unchanged during live shade selection.
- Live Take Photo switches to capture mode, stops tracks/VIDEO workers and
  performs exactly one IMAGE analysis. Captured original pixels exactly equal
  the raw mirrored camera frame, proving the live overlay is not captured.
- Captured shade changes reuse the IMAGE mask. Downloaded PNG bytes match the
  processed result exactly. Retake and regular Capture Photo still work without
  any additional live inference.
- Stop and delayed permission cleanup; mobile 390 px layout without horizontal
  overflow; mobile Window 2 switch releases live resources while preserving
  still/guide state. Observed page requests were local GET/HEAD asset/navigation
  requests, with no image upload. No uncaught browser exceptions.

Five additional checks passed in a separate Chrome profile without automatic
permission approval: native camera denial in both modes, preservation of the
previous photo, upload availability and absence of uncaught exceptions. A rapid
shade change back to the previously rendered shade also completed without
another inference. Final explicit GPU and automatic CPU fallback were retested
with real Burgundy segmentation after the software-renderer detection change.

## Modified files

| Area | Files |
| --- | --- |
| Three-mode UI | `src/components/try-on/HairTryOn.tsx`, new `LiveCameraPreview.tsx`, `ShadePalette.tsx`, `src/app/camera.css` |
| Shared native factories and extraction | `src/lib/ai/mediapipe.ts`, `hair-segmentation.ts`, `segmentation.worker.ts` |
| Separate live processing | new `src/lib/ai/live-client.ts`, `live-segmentation.worker.ts`, `live-utils.ts`, `src/types/live-camera.ts` |
| Shared colour buffer support | `src/lib/ai/hair-recolor.ts` |
| Build/export checks | `scripts/sync-mediapipe-assets.ts`, `verify-deployment.ts` |
| Regression tests | new `tests/live.test.ts`, `tests/vision.test.ts` |
| Documentation | root/app README, `docs/ARCHITECTURE.md`, `SETUP.md`, `DEMO_GUIDE.md`, `KNOWN_LIMITATIONS.md`, `VERCEL_READINESS.md`, historical note in `CAMERA_CAPTURE_REPORT.md`, this report |

`CameraPreview.tsx`, the original capture helper, before/after component,
selected-shade Context, guide rules, palette data, models and dependency lockfile
were preserved. Private user portraits and generated QA screenshots are not
added to the repository. Local `.env` remains ignored; no secret is required.

## Remaining device checks

Physical webcam permission prompts, actual phones, Safari/Firefox and a hardware
GPU remain unverified. A virtual webcam/mobile viewport validates the application
flow, not those devices. Live is intentionally experimental; low FPS, moving
heads, fine edges, low light and conservative skin exclusion can reduce quality.
For finer detail and stable comparison/downloads use Take Photo or Upload Photo.
No cloud deployment was performed as part of this change.

API references: [Google Image Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter),
[ImageSegmenter JavaScript API](https://developers.google.com/edge/api/mediapipe/js/tasks-vision.imagesegmenter).
