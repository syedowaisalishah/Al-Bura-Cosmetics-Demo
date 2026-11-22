# Al Bura Cosmetics — AI Hair Colour Try-On Demo

A browser-only cosmetics demonstration: upload a portrait or capture a camera
photo, try twelve illustrative hair shades, compare before/after, save a PNG and
review a synchronized educational colour guide. Photos stay on the device.

## Technologies

Next.js 16.4.6 App Router, React 19.3, TypeScript, Tailwind CSS 4, Canvas 2D and
MediaPipe Tasks Vision 1.2.3. The two existing official Google models run locally
in an IMAGE-mode worker. CIELAB recolouring preserves strand contrast, limits
saturation and protects bright reflections. There is no paid API, inference
server, database or continuous camera AI loop. This is a demo, not production-ready.

## Install and run

Use Node **22.x** (`.nvmrc` pins the tested local version).

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:3000/try-on/. Installation generates matching local WASM and
worker assets; models are included in `public/models`. Model loading starts only
when a photo is processed. Camera preview is normal video with no inference.

This workspace has a real Git-ignored `.env` (mode 600), with local public asset
paths. No secret credentials are required; fresh clones work with defaults.
There is no `.env.example`. Optional settings are listed in [SETUP](docs/SETUP.md).
Never put secrets in `NEXT_PUBLIC_` variables or commit `.env`.

## Check and build

```bash
npm test
npm run typecheck
npm run lint
npm run model:verify
npm run deploy:check
npm start
```

`npm run deploy:check` runs TypeScript, ESLint, tests and the production build.
`npm run build` generates matching WASM/worker assets, verifies both model
artifacts and emits a static `out/` site. Its postbuild check verifies exported
pages, referenced assets, exact model/runtime bytes and private-file exclusions.
`npm start` serves that export at http://127.0.0.1:3000; use `PORT=3002 npm start`
if development already uses that port. It is a local preview, not a backend.

## Deploy to Vercel

**Deployment is prepared; no Vercel account/project credentials are configured in
this workspace, and no Vercel deployment has been performed.**

Vercel Hobby is for personal, non-commercial use. A cosmetics-company pitch or
client project may fall outside that scope. Confirm eligibility before using
Hobby; this repository does not enable a paid plan, trial or add-on. See
[Vercel fair-use rules](https://vercel.com/docs/limits/fair-use-guidelines).

For eligible use:

1. Commit and push the completed source to your Git repository. Deploy the
   current branch/commit, including the latest camera and hair-edge fixes.
2. Sign in to Vercel, select **Add New → Project**, and import that repository.
3. Set **Root Directory** to `albura-ai-demo` when importing the parent repository.
   Use the app root directly if the app is its own repository.
4. Select **Other** as Framework Preset, **Node.js 22.x**, Install Command
   `npm ci --include=dev`, Build Command `npm run build`, and Output Directory
   **`out`**. Build-time tools are development dependencies, so they must be
   installed.
   The app-root `vercel.json` sets the static build commands/output and
   `framework: null`. Next.js still builds the app; Vercel serves its export.
5. Add **no environment variables** for the default demo. Do not upload `.env`.
   Do not configure server functions, storage, databases, analytics add-ons or
   external AI. `.vercelignore` also excludes local private/build/test files.
6. Deploy, then use the returned **HTTPS** address. Visit `/` and `/try-on/`,
   upload a photo, choose a shade, check Download Result, and allow camera access
   for Take Photo. On a phone, open the HTTPS address in its own browser.
7. In browser Network tools confirm successful `/workers/hair-segmenter.js`,
   `/models/hair_segmenter.tflite`,
   `/models/selfie_multiclass_256x256.tflite` and the matching `/wasm/` requests.
   A missing file or HTML response for a model/WASM path indicates a wrong root,
   output directory or skipped asset-sync step. Run `npm run assets:sync` and
   rebuild; do not substitute masks or a fake preview.

Keep the export at the domain root: model/WASM/worker paths are absolute. Avoid
an SPA rewrite that turns binary asset requests into HTML. The site uses no
server routes. HTTPS/localhost is required for `getUserMedia`; HTTP LAN preview
addresses cannot open a camera. In an iframe, the parent must also permit camera
access; use the direct deployment URL for the company demo.

Quick settings:

| Vercel setting | Value |
| --- | --- |
| Root Directory | `albura-ai-demo` |
| Framework Preset | Other |
| Node.js Version | 22.x |
| Install Command | `npm ci --include=dev` |
| Build Command | `npm run build` |
| Output Directory | `out` |
| Environment Variables | None required |

If a project already exists, set the root under Project Settings → Build and
Deployment, then redeploy the latest commit. Do not select `.next` as the output
or add a catch-all HTML rewrite. For an optional future backend, change to the
Next.js preset and remove static export/output overrides as a separate change.

A [deployment readiness record](docs/VERCEL_READINESS.md) documents the clean
installation and production build checks.

Settings references: [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build),
[vercel.json](https://vercel.com/docs/project-configuration/vercel-json),
[Git import](https://vercel.com/docs/git).

## Demo and limits

- [Three-minute presentation script and walkthrough](docs/DEMO_GUIDE.md)
- [Known limitations and production work](docs/KNOWN_LIMITATIONS.md)
- [Phase 5 audit, changed files and final verification](docs/PHASE_5_REPORT.md)
- [Architecture](docs/ARCHITECTURE.md) and [local configuration](docs/SETUP.md)
- [Camera capture implementation](docs/CAMERA_CAPTURE_REPORT.md)
- [Official model provenance, hashes and licenses](public/models/README.md)

Every shade is illustrative and pending official Al Bura approval. There is no
official 180-shade palette. The guide is explicitly `demo_unapproved`; developer
strengths, quantities, ratios, processing timers and bleach instructions remain
locked. A visual preview does not predict actual dye outcomes. Segmentation can
still fail on difficult edges, lighting, occlusion and backgrounds.
