# Current setup

Updated 24 November 2026. This is a full-stack Next.js app with browser AI and
three backend endpoints. Use `.next` for deployment. Earlier `out/` static-export
instructions in phase reports describe a historical implementation.

## Start locally

Use Node **22.x**, the project's tested build target. From the repository root:

```bash
cd albura-ai-demo
npm ci
npm run dev
```

Open http://127.0.0.1:3000/try-on/. For a production preview:

```bash
npm run deploy:check
npm start
# Optional alternative: npm start -- --port 3002
```

`npm start` runs the Next.js server, including the API routes. It requires a
successful production build. The dependencies and resolved versions are recorded
in `package.json` and `package-lock.json`; `npm ci` reproduces that install.

## Commands and generated assets

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Generate route types and check TypeScript |
| `npm run lint` | Check code and module import boundaries |
| `npm test` | Run the unit/API tests |
| `npm run assets:sync` | Bundle both workers and copy matching MediaPipe SDK/WASM assets |
| `npm run model:verify` | Check both original model binaries and hashes |
| `npm run build` | Generate assets, verify models, build Next.js, then verify deployment output |
| `npm run deploy:check` | Run the complete type/lint/test/build verification sequence |

`postinstall`, `predev` and `prebuild` regenerate required browser assets. If
installation scripts were disabled, run `npm run assets:sync` explicitly.
`public/workers/` contains generated bundles; edit their source in `src/web/ai/`.
Do not edit generated `.next` or worker bundles.

## Photo and camera

JPG/JPEG, PNG and WebP are accepted up to 15 MB and 50 MP. Processing limits the
longest side to 1024 px. Upload and capture share one still-image analysis pass
through the two existing local models. Shade changes reuse the mask and Lab cache.

Take Photo shows ordinary video until capture. Mirroring defaults on and is
applied consistently to captured pixels, preview and download. Experimental Live
uses a separate VIDEO worker, GPU/CPU selection/fallback and measured FPS. Its
analysis scheduler allows at most eight frames per second; actual FPS can be lower.

Use localhost or HTTPS and a direct browser tab. Allow camera permission and
close other applications using it. Mobile browsers vary; test the actual
presentation phone and laptop. Hiding a camera pane/page or leaving the route
releases its camera resources. Upload remains available when camera permission fails.

## Local `.env`

No secret credentials are required for this demo. Default self-hosted asset paths
work without environment overrides. A real local `.env` may override them and is
ignored by Git. The application reads these optional, non-secret public settings:

- `NEXT_PUBLIC_HAIR_MODEL_PATH`
- `NEXT_PUBLIC_HAIR_GUARD_MODEL_PATH`
- `NEXT_PUBLIC_VISION_WASM_PATH`
- `NEXT_PUBLIC_ENABLE_MASK_DEBUG` — development-only mask display

Next.js loads `.env` automatically. Public values are embedded during the build;
restart/rebuild after changing them. `NEXT_PUBLIC_` values are visible in the
browser. Future server secrets must remain server-only and must never be copied
into `public/`. Do not commit or publish the local `.env`.

## Vercel

| Setting | Value |
| --- | --- |
| Root Directory | `albura-ai-demo` |
| Framework | Next.js |
| Node | 22.x |
| Install | `npm ci --include=dev` |
| Build | `npm run build` |
| Output | `.next` |
| Required environment variables | None for demo defaults |

Serve at the domain root so `/models/`, `/wasm/` and `/workers/` resolve. The
existing demo URL is https://albura-ai.vercel.app/. Verify the new deployment's
status and endpoints when publishing; an older successful deployment does not
prove a newer commit is live.

## Data and consultation

The catalogue is validated illustrative JSON in `src/shared/data/`. The initial
server-rendered studio receives it directly; the backend also exposes it at
`/api/shades/`. There is no database or authenticated admin.

Window 2 receives an approximate starting level from original photo pixels.
Confirmation or manual correction enables summary/print export. Only profile
metadata reaches `/api/guide/calc/`; images, masks and frames remain in the
browser. Consultation rules are deterministic and unapproved for chemical use.

See [the interview guide](INTERVIEW_GUIDE.md) for an explanation of each layer,
[the architecture](ARCHITECTURE.md) for the processing flow, and
[the limitations](KNOWN_LIMITATIONS.md) for outstanding production work.
