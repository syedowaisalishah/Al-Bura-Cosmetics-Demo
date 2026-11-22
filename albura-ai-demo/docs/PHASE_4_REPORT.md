# Phase 4 — Live camera hair recolouring (historical)

This live inference implementation has been replaced by the
[Camera Capture + AI Photo Try-On workflow](CAMERA_CAPTURE_REPORT.md).
The figures and file/API descriptions below describe the earlier version.

Implemented locally on 2026-11-22 (Asia/Karachi), retaining the existing photo
pipeline, twelve sample shades, shared React Context and Window 2 guide. No new
runtime dependency, paid API, AI framework, shader, backend or database was added.

## Camera and VIDEO API

The installed `@mediapipe/tasks-vision` **1.2.3** exposes `ImageSegmenter` with
`runningMode: "VIDEO"` and `segmentForVideo(frame, timestampMs)`. Both verified
Google models use that API in a **separate camera worker**. The photo singleton
keeps its original IMAGE mode and cache; neither instance is reconfigured.
Timestamps are strictly increasing milliseconds. Native results are copied before
closing, incoming bitmaps close in `finally`, and displayed bitmaps close after use.

Window 1 now has Upload Photo / Live Camera tabs. Start requests front-facing
640×480 video with no audio; the untouched native video sits below the processed
Canvas 2D preview. Stop releases all tracks. Flip appears for multiple available
cameras, stops the previous stream, and starts the chosen device. Permission,
missing/busy devices, unsupported features, insecure contexts and model failures
have visible errors with Upload Photo available. Access requires localhost/HTTPS.

The camera worker reuses the established dual-model agreement, explicit skin
exclusion, mask alignment/refinement and texture-preserving CIELAB colour engine.
An rAF loop throttles to **at most 10 inferences/second**, skips duplicate source
frames and permits only one pending inference. Three consecutive frames above
180 ms reduce processing to 320×240 without reopening the stream. Reusable input
and OffscreenCanvas objects plus Lab/output buffers reduce allocations. React
updates on meaningful state changes and about once per second for FPS.

Temporal smoothing blends 70% current / 30% previous alpha **only inside current
hair support**. It cannot expand into newly excluded skin/background. No-hair
frames, resolution changes and long gaps reset history. Feathering stays inside
the detected region. This is conservative smoothing, without motion tracking.

The current shade is read from a ref backed by the existing Context. Palette
changes update Window 2 immediately; stale-shade frame results are discarded.
Snapshot copies the visible processed canvas before asynchronous PNG encoding,
retains the captured shade metadata and downloads the actual PNG. Original-video
view disables capture. All frames and snapshots stay in browser memory; nothing
is uploaded. Stop, tab changes, page hiding, route teardown and cancelled startup
release streams/workers/animation frames. Snapshot URLs revoke on replace/unmount.

## Files changed in this phase

| File | Change |
| --- | --- |
| `src/components/try-on/CameraPreview.tsx` | Camera lifecycle, scheduling, processed preview, Flip, FPS, snapshots and errors |
| `src/components/try-on/HairTryOn.tsx` | Photo/camera tabs, retained photo state and camera activation |
| `src/components/try-on/TryOnStudio.tsx` | Stop camera when mobile navigation hides Window 1 |
| `src/lib/ai/mediapipe.ts` | Independent fixed-mode VIDEO worker client, timestamps, abort and response ownership |
| `src/lib/ai/hair-segmentation.ts` | Shared native output extraction for `segment` / `segmentForVideo` |
| `src/lib/ai/segmentation.worker.ts` | Timestamped dual-model inference and live Canvas recolouring |
| `src/lib/ai/hair-recolor.ts` | Optional reusable workspace/output and worker execution without timer yields |
| `src/lib/ai/live-camera.ts` | Resolution policy, temporal smoothing, error mapping and track cleanup |
| `src/types/camera.ts`, `src/types/vision-worker.ts` | Typed frame metadata and transferable VIDEO protocol |
| `src/app/camera.css`, `src/app/layout.tsx` | Existing navy/gold/cream camera styling |
| `src/app/page.tsx`, `src/app/try-on/page.tsx` | Photo/camera introduction and local privacy copy |
| `tests/camera.test.ts` | Eight meaningful camera/math/API/buffer tests |
| Root/app README and `docs/ARCHITECTURE.md`, `SETUP.md`, `IMPLEMENTATION_PLAN.md` | Current operation, design and delivery boundaries |

Earlier Phase 2/3 changes remain in this working tree. No additional secret is
required. The real app-root `.env` remains Git-ignored with permissions 600;
there is no `.env.example` and `.env` is excluded from the static export.

## Verification and measured performance

Test environment: Ubuntu 26.04, Chrome 151 headless, Intel Core i7-1365U, CPU
MediaPipe delegate. Chrome's virtual webcam delivered a local Y4M recording of a
real portrait, followed by a blank interval and the returning portrait. Both real
models ran for every processed frame; no mask or recoloured result was mocked.
The source is a repeated portrait/blank sequence, so this validates frame
processing and disappearance, **not head-motion quality or physical-webcam
performance**. Separate native virtual devices verified device switching.

- First processed frame: 640×480, **38,618 detected hair pixels**.
- After adaptation: 320×240, **9,451 detected hair pixels**.
- Development run: **1.48 processed FPS** in the short adaptation sample, then
  approximately **1.8–2.0 FPS** at 320×240. The final production-export run
  measured **2.97 FPS** during adaptation and displayed approximately
  **3.9–4.3 FPS** at 320×240 later in the sequence. These test-environment
  observations are not a physical-laptop or production performance guarantee.
  The 10/s scheduler cap is a maximum, not the achieved throughput.
- Shade selection reached the VIDEO canvas and Window 2 without reopening the
  stream. Only one inference was pending at any time; timestamps increased.
- A real VIDEO-worker pixel check changed 9,593 portrait pixels; the sampled face,
  lower-skin and background patches had **zero changed pixels**. Switching shade
  changed 9,574 pixels. The subsequent empty frame had zero hair and **zero
  changed pixels**, including no retained old colour. These sample checks do not
  prove universally perfect semantic boundaries.
- Capture produced a 320×240 PNG. Its downloaded bytes matched the captured blob
  SHA-256; PNG signature and nonempty content passed.
- Repeated Start/Stop, duplicate Start, stopping before permission completion,
  photo-mode switch, mobile guide switch and route unmount released every track
  and VIDEO worker. On full route teardown all tracked blob URLs were revoked.
- Flip opened a different native virtual device and ended the old track.
- Permission denied, missing and busy camera errors were injected at the browser
  API boundary to exercise their UI paths. Unsupported access was checked with
  the API unavailable. A missing real model URL caused actual model loading to
  fail, stopped the stream and left Upload Photo available. No fake AI fallback.
- No uncaught page errors or external frame/photo network requests in the normal
  integration run. All website, worker, model and WASM assets were local.
- `npm run typecheck`: **PASS**.
- `npm run lint`: **PASS**, no warnings.
- `npm test`: **31/31 PASS** (8 camera, 16 guide, 7 vision).
- `npm run model:verify`: **PASS**, both official hashes/labels/shapes.
- `npm run build`: **PASS**, static `out/` export generated.

Production-export camera regression: **PASS**. The full portrait/blank/return
sequence, shared shade change, capture/download, adaptive resolution, single
pending inference, monotonic timestamps, repeated start/stop, mobile hiding,
route unmount and photo-cache preservation all passed on `npm start` serving
`out/`. All tracked streams/workers ended and blob URLs revoked on route exit.
No page errors or external requests occurred.

Production-export photo regression: **PASS**. Brown, dark and blonde portraits
processed with the real models; rapid shade changes reused the cached mask with
one analysis per photo. Mouse, keyboard and mobile touch comparison worked. PNG
bytes matched the displayed result; invalid/no-hair inputs, reset, cancellation
and object-URL cleanup passed. No uncaught errors or external requests occurred.

Production-export guide regression: **PASS**. Lift/history scenarios, immediate
shade synchronization, guide-only changes without photo reinference/recolour,
retained photo across mobile tabs, keyboard navigation, deep links, print/PDF and
desktop/tablet/mobile overflow checks passed. No console errors or external
requests occurred.

## Remaining limits and deployment

The preview is functional in the tested browser and virtual-camera setup, with
low CPU throughput as the main observed limit. Physical webcam permission prompts,
real head movement, other device speeds and Safari/Firefox have not been verified.
Fine edges, occlusion, dim lighting and difficult backgrounds can still cause
model errors. Lower resolution trades detail for responsiveness; smoothing cannot
recover missing hair or track rapid movement. No production-performance claim is
made. Actual dye outcomes cannot be inferred from a visual preview.

The existing Sites project still returns **"Sites project not found" (404)**.
The configured project identity is preserved; this phase has not been published
to the earlier private URL. No new Site was created to bypass that missing access.
A verified static deployment archive is available locally at
`/tmp/albura-phase4/albura-phase4-deploy.tar.gz`; it contains the export and
normalized hosting manifest, without `.env`, source photos or test fixtures.

API references: [Google ImageSegmenter web guide](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter),
[MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
