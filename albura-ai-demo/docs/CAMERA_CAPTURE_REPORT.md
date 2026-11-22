# Camera Capture + AI Photo Try-On

Replaces the earlier continuous VIDEO inference implementation. Window 1 has
**Upload Photo** and **Take Photo** tabs; both feed one photo-processing path.
No models, dependencies, paid APIs, backend or database were added.

## Working behaviour

- Open Camera requests front-facing video without audio. Preview is native video,
  with `playsInline` for mobile. There is no inference loop or recolouring overlay.
- Capture Photo freezes the current frame into a canvas, applies the selected
  selfie orientation, encodes a local PNG File and stops every camera track.
- The captured File and uploaded File both call
  `HairTryOn.processPhoto(file, source)` → `preparePhoto` → `analyze` →
  `segmentHair` → `refineHairMask` → `prepareHairColor` → `recolorHair`.
- One IMAGE analysis runs per photo, using the same existing verified hair model
  and multiclass confirmation/skin guard. These are the original model pair,
  rather than newly installed models. A shade change reuses the refined mask,
  original pixels, Lab values and hair statistics; it does not run another analysis.
- The existing texture/lighting-preserving colour math, comparison slider,
  synchronized palette/Window 2 guide and processed PNG download are preserved.
- Retake opens a fresh camera session and clears the previous photo only after
  permission and playback succeed. A failed retake leaves the existing result.
- Mirror selfie defaults on. Capture bakes the same horizontal transformation
  into the pixels, so preview, original photo, after image and download agree.
  Turning it off before capture gives the normal camera orientation.
- Permission denial, missing/busy cameras, unsupported access and insecure
  contexts show errors. Upload Photo stays available. Localhost or HTTPS is
  required by browsers; mobile camera access depends on browser permission.
- Capture, Stop, tab changes, page hiding and route unmount stop camera tracks.
  Late permission results are stopped immediately after cancellation. Pending
  PNG encoding cannot submit a photo after the camera component unmounts.
- Camera owns no blob URLs. The existing photo owner revokes original/result/debug
  URLs on replacement/reset/route teardown and releases the worker. Frames,
  photos and results remain on the device; only app/model/WASM assets load.

## Modified files

| File | Change |
| --- | --- |
| `src/components/try-on/CameraPreview.tsx` | Native camera preview; Open/Capture/Retake/Stop, mirroring, errors and stream lifecycle |
| `src/components/try-on/HairTryOn.tsx` | Shared `processPhoto` entry, Take Photo tab, common photo result and download/change-shade controls |
| `src/components/try-on/BeforeAfterSlider.tsx` | Original-image description supports both photo sources |
| `src/components/try-on/ShadePalette.tsx` | Focusable heading for Change Shade navigation |
| `src/lib/camera.ts` | Capture-to-File, camera error mapping and all-track cleanup |
| `src/lib/ai/mediapipe.ts` | IMAGE-only singleton; removed live worker/client and propagated actual worker failures |
| `src/lib/ai/segmentation.worker.ts` | Existing dual-model IMAGE segmentation only |
| `src/lib/ai/hair-segmentation.ts` | IMAGE API extraction only; native result ownership preserved |
| `src/lib/ai/hair-recolor.ts` | Removed video-only workspace options; existing photo colour algorithm retained |
| `src/types/vision-worker.ts` | Removed video-frame, processed bitmap and timestamp protocol |
| `src/app/camera.css` | Native preview, mirror transform, capture controls and photo labels |
| `src/app/page.tsx`, `src/app/try-on/page.tsx` | Camera capture copy |
| `tests/camera.test.ts` | Replaced obsolete video tests with capture/IMAGE checks |
| Root/app README, architecture/setup/delivery docs | Current workflow and limits; historical live-camera report marked superseded |

Removed `src/lib/ai/live-camera.ts` and `src/types/camera.ts`. Continuous rAF
scheduling, VIDEO factories, `segmentForVideo`, temporal masks, live quality/FPS
logic, OffscreenCanvas live output and snapshot-only UI are no longer in the
application source. Existing shared Context, guide rules, shade data and app
architecture remain in use. The real private `.env` is unchanged and ignored.

## Verification

Browser checks use Chrome 151 headless on Ubuntu with a virtual webcam delivering
real portrait frames from a local Y4M file. The source is controlled; both real
MediaPipe models and the real colour pipeline run. No segmentation masks or
colour results are mocked. Physical desktop/mobile webcams and other browsers
remain unverified.

Development browser integration passed:

- Native preview had **zero AI workers and zero segmentation measurements**.
- Capture stopped every camera track before worker initialization/segmentation.
  Exactly one `segment` request and one `albura:segmentation` measurement occurred.
- Captured original was 640×480. Its pixels matched the mirrored source frame
  with **zero differing bytes**; mirroring off also displayed normally on retake.
- Honey Blonde, Burgundy and Ash Blonde produced three different PNG hashes.
  Analysis count stayed **1** throughout; Window 2 matched each selection.
- Before/after slider keyboard interaction updated the comparison.
- Download Result produced a valid 468,159-byte PNG whose SHA-256 matched the
  displayed result blob.
- Retake captured a new photo with one additional analysis. File upload still
  worked, and its subsequent shade change reused the mask without another analysis.
- Mobile-width guide navigation stopped the camera, retained the photo/cache
  and had no horizontal overflow. The video uses `playsInline` and no audio.
- Stop and route navigation released all tracks; teardown terminated the IMAGE
  worker and left **zero tracked blob URLs**.
- Delayed permission after Stop released its newly granted stream. Permission
  denied, missing and busy camera messages were exercised by injected browser API
  errors. These injections test the UI; they do not certify physical prompts.
- No uncaught page errors or external image/frame requests in the normal run.
- Application source search found no VIDEO inference API, live frame protocol,
  temporal mask, frame scheduler or video workspace references.

Checks:

- `npm test`: **27/27 PASS** (4 camera/IMAGE, 16 guide, 7 vision).
- `npm run typecheck`: **PASS**.
- `npm run lint`: **PASS**, no warnings.
- Model hash/labels/shapes verification in prebuild: **PASS**, unchanged artifacts.
- `npm run build`: **PASS**, static export generated.

The complete browser integration also **passed against the production `out/`
export served with `npm start`**, including zero preview inference, one analysis
per capture, three distinct cached shade results, mirroring, PNG download,
retake/upload, mobile-width navigation, errors, track/URL cleanup and no external
requests or page errors.

## Remaining issues and deployment

No functional failure was found in the completed integration paths. The inherited
photo segmentation can still miss fine strands or confuse challenging lighting,
occlusion and backgrounds. This workflow removes slow live blending; it does not
claim a new model or universally accurate hair boundaries. Real desktop/mobile
permission prompts, physical cameras, Safari and Firefox still need device tests.

The existing Sites project still returns **`Sites project not found` (404)**.
Its configured identity is preserved, and the old private deployment has not
been updated. The static deployment archive is
`/tmp/albura-capture/albura-camera-capture-deploy.tar.gz`. Its contents were
checked: no `.env`, source photos or video fixtures are included.
