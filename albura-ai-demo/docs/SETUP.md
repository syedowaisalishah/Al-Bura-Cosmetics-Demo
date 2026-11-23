# Local setup and configuration

Verified on 2026-11-22 (Asia/Karachi): Ubuntu 26.04 LTS, Node 22.22.1, npm 9.2.0,
Git 2.53.0, Chrome 151. Next.js 16.4.6, React 19.3.0, TypeScript 5.9.3,
Tailwind 4.3.3 and MediaPipe Tasks Vision 1.2.3 are locked in `package-lock.json`.
The local `tsx` runner handles TypeScript utilities because the installed Node
binary lacks native TypeScript support. No sudo/system changes are required.

## Start

```bash
cd albura-ai-demo
npm ci
npm run dev
```

Open http://127.0.0.1:3000/try-on/. Select a JPG/JPEG/PNG/WebP portrait, then
choose a sample shade. Wait until the preview is ready before downloading PNG.
Photos stay on the device. File limit is 15 MB; image processing is limited to
1024 px on the longest side, retaining aspect ratio and browser-decoded orientation.
Use a current Chrome/Edge browser with workers, WebAssembly and Canvas 2D.
Other browsers require their own validation; the app reports unsupported features.

## Take a photo

In Window 1 select **Take Photo**, then **Open Camera** and allow permission.
The camera shows normal video; no model loads or AI analysis run while framing.
Use localhost or HTTPS; an ordinary HTTP LAN address cannot open the camera.
The stream prefers the front camera with `playsInline` for mobile browsers.

**Capture Photo** freezes the frame, stops every camera track and passes a local
PNG File to the exact same `processPhoto` function as Upload Photo. Both run the
existing IMAGE segmentation once per photo and cache the mask/colour data.
Change shades without another inference; compare before/after, select **Change
Shade**, and use **Download Result** to save the processed PNG.

**Mirror selfie** defaults on: mirroring is baked into the captured pixels so
preview, original, recoloured result and download have the same orientation.
Uncheck it before capture for a normal camera orientation. **Retake** reopens the
camera; the previous result clears only after the new preview opens successfully.
**Stop Camera**, switching away, hiding the page or leaving the route releases
tracks. Captured files stay local, and result URLs revoke on reset/replacement
or route teardown. Camera failures leave Upload Photo available.

Mobile browsers require permission and a secure origin. Physical mobile devices,
Safari and Firefox still need their own verification. See
[the current three-mode report](LIVE_CAMERA_REPORT.md) for the tested environment.

## Experimental Live AI Camera

Select **Live AI Camera** → **Start Live Camera**. This is a separate mode;
Take Photo still shows normal video without inference. Automatic processing
tries GPU, prefers CPU for known software renderers, and falls back to CPU on
GPU initialization/frame errors. Select explicit CPU or GPU while stopped to
compare on your device. Live uses fixed VIDEO models, `segmentForVideo`, one
frame at a time, current-frame mask support and bounded adaptive resolution.
Measured FPS appears after frames arrive. Take Photo is the recommended path
for finer detail, before/after comparison and downloads. Its shortcut captures
raw camera video rather than the recoloured canvas.

## Real `.env`

This workspace contains **`albura-ai-demo/.env`**, mode 600, ignored by Git.
There is no `.env.example`. Next.js loads `.env` automatically. For a fresh clone,
create the local file yourself if overriding defaults:

```dotenv
# Public asset configuration, NOT secrets.
NEXT_PUBLIC_HAIR_MODEL_PATH=/models/hair_segmenter.tflite
NEXT_PUBLIC_HAIR_GUARD_MODEL_PATH=/models/selfie_multiclass_256x256.tflite
NEXT_PUBLIC_VISION_WASM_PATH=/wasm
NEXT_PUBLIC_ENABLE_MASK_DEBUG=true
```

No secret credentials are required by this client-only application. Keep future
real secrets in `.env` without the `NEXT_PUBLIC_` prefix; never copy them into
`public` or expose them to the browser. Public values are embedded during build:
restart development/rebuild when changing them. The mask toggle appears only
in development with the debug flag enabled; it is absent from production builds.
Do not commit `.env`. Defaults support ordinary local and hosted builds without it.

## Commands

```bash
npm test
npm run typecheck
npm run lint
npm run model:verify
npm run deploy:check
npm start
```

`npm start` serves the static `out/` export locally; `PORT=3001 npm start` selects
another port. `npm run dev` starts Next.js development mode. Stop with Ctrl+C.
Type checking regenerates route types before `tsc --noEmit`; lint runs separately.

`npm ci` runs the asset sync through postinstall. `predev` and `prebuild` also
regenerate matching WASM files and both browser workers. If lifecycle scripts are
disabled, run `npm run assets:sync` explicitly. esbuild is a development-time
worker bundler; it adds no server or paid runtime dependency.

## Models and performance

The official hair-only float32 v1 model and official selfie-multiclass 256 model
are included in `public/models`. `npm run model:verify` checks both exact hashes,
TFLite structure, float32 types, tensor shapes and embedded labels. Restore both
using `npm run model:download`; invalid downloads fail without fake substitutes.

The second AI model protects against observed hair-only background errors. Both
load once per session and run in a local CPU worker for each new photo. Changing
shade only recolours the cached image/mask. Camera captures use that same IMAGE
worker and pipeline. Live runs a separate VIDEO pair with mask/statistic
smoothing and no photo-cache mutation. Input downscaling reduces pixel work,
but the existing models still infer at their fixed 512/256 tensor sizes.
See the measured CPU/software-GPU comparison in `LIVE_CAMERA_REPORT.md`.
Inference, masking and colour quality
remain affected by fine edges, lighting, occlusion and backgrounds. No model can
guarantee pixel-perfect hair boundaries or real-world dye outcomes.

## Static hosting

Build command: `npm run build`; application root: `albura-ai-demo`; output: `out`;
Node: 22.22.1. Sites identity/static directory is in `.openai/hosting.json`.
[Cloudflare Pages also supports Next.js static exports](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/).
Check current free-plan limits before publication. No paid API or cloud inference
service is needed. Serve from the domain root so `/models`, `/wasm` and `/workers`
resolve; subpath hosting requires corresponding URL/basePath changes.

The shade palette provides name/code/HEX/level/reflection search and family
filters. Clearing filters restores all twelve samples without resetting selection.
Use Original / Compare / Colour preview beside the range control.

Window 2 provides a synchronized educational demo guide: choose natural
level manually, change history/grey/length/density, and review the derived
classification. On mobile, switch between the two tabs without losing the photo.
The Print demo guide action uses browser printing and excludes the portrait.
All chemical outputs remain locked and every assessment is unapproved.

No photo fixtures or local `.env` files should be packaged for publication. The
scope PDF and approved Al Bura shade/technical rules remain missing inputs for
future brand fidelity; they do not block the illustrative photo try-on.

For the current Vercel static-export settings and deployment status, follow
[README deployment](../README.md#deploy-to-vercel). No paid infrastructure is enabled.

Vercel installation uses `npm ci --include=dev` so tsx, esbuild and TypeScript
are available during build. `npm run build` invokes a postbuild export check;
`npm run deploy:verify` can rerun that check against an existing `out/`.
