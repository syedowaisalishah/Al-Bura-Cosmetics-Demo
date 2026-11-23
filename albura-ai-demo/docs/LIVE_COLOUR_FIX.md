# Live colour blending correction — 2026-11-23

The reported Ash Blonde preview looked like a solid light cap on dark hair.
Live mode used the stronger photo appearance at 88% strength and enlarged a
320-pixel frame. This combination could emphasize the mask silhouette and
lose fine strand detail, particularly in dim webcam lighting.

## Changes

- Live rendering starts within **640 × 480**, retaining source aspect ratio and
  never enlarging a smaller source. Sustained slow pixel/transfer work can reduce
  this to 480 × 360 or 320 × 240. Fixed-size inference time remains excluded from
  this quality decision. A 16:9 source starts at 640 × 360.
- The existing CIELAB engine has an explicit **live appearance**. It uses smaller
  exposure changes, gentler chroma, more source colour variation and stronger
  protection of dark strands. Maximum positive logit shift is 0.4; even at full
  strength, resulting lightening stays around ten Lab L units or less before
  rounding. This avoids forcing a bright palette swatch onto dim hair.
- **Colour strength** defaults to **70%**, with a 0–100% slider. Its value travels
  with each frame; stale results from an earlier strength are discarded. Changing
  strength does not create another worker or allow overlapping inference.
- A small inward feather scales with live resolution. Smoothing still cannot
  expand beyond current AI hair support or carry tint onto excluded pixels.
- Upload Photo and Take Photo retain the default photo appearance, IMAGE cache,
  comparison and downloads. The capture shortcut still reads untouched video.
  Palette selection and Window 2 remain shared across all modes.

Light shades intentionally look subtler on dark or poorly lit hair. Increasing
strength increases the tint while preserving exposure limits. The feature cannot
recover texture absent from the camera image or guarantee perfect hair edges.

## Verification

`PATH=/usr/bin:/bin npm run deploy:check` passed on Node 22.22.1:
TypeScript, ESLint, **44 tests**, production build and static export verification
(two original models, two workers and matching WASM assets).

New regression checks verify bounded blonde lightening on dim hair, retained
strand lightness order/contrast, unchanged non-hair/source pixels, zero-strength
identity and non-accumulating strength changes. Default photo tests still pass.

Real MediaPipe VIDEO inference was tested on the existing curly-hair portrait
at normal exposure and an explicitly simulated dim exposure. Ash Blonde,
Burgundy and Warm Copper were visually compared before/after the change. These
are test fixtures, not the unavailable raw webcam frame from the screenshot.
No inference results or application masks were fabricated.

**49 production browser checks passed**, including all three modes, three shade
changes, Window 2, comparison, PNG download matching the processed result,
raw mirrored capture, cached IMAGE processing, lifecycle cleanup and mobile
layout. Added checks verify 640-pixel output, exactly original pixels at 0%,
100% slider output and strength changes without worker restarts. The measured
CPU sample was **3.4 displayed FPS at 640 × 480**; this is device-dependent.

Explicit GPU delegate testing on Chrome's **software SwiftShader renderer** also
passed at 640 × 389, with 0%, 70% and 100% strength. Zero strength changed no
pixels; tinted frames changed hair while leaving sampled face/background regions
unchanged. This was functional validation, not a physical GPU speed claim.

## Files

`src/lib/ai/hair-recolor.ts`, `live-utils.ts`, `live-client.ts`,
`live-segmentation.worker.ts`; `src/types/live-camera.ts`;
`src/components/try-on/LiveCameraPreview.tsx`; `src/app/camera.css`;
`tests/live.test.ts`, `tests/vision.test.ts`; related live setup/architecture docs.

Refresh `/try-on/` after rebuilding, open Live AI Camera and try the strength
slider. A direct comparison against the original feed is available with Show
original. Physical webcam quality still needs user confirmation; live remains
experimental and Take Photo remains available for the higher-quality still path.
