# Al Bura Cosmetics · Colour Studio

An interview prototype of the Al Bura brief: real browser AI hair recolouring,
three photo/camera modes, and a connected colour consultation backed by Next.js
route handlers. **Window 2 now receives an approximate starting level from the
original hair pixels in Window 1, asks for confirmation, and recalculates for the
selected shade and hair profile.**

Start with the [interview guide](docs/INTERVIEW_GUIDE.md) for a simple explanation,
the code reading order and likely questions. The [documentation index](docs/README.md)
separates current instructions from historical implementation reports.

## Run

Node **22.x** is the tested deployment target.

```bash
npm ci
npm run dev
# http://127.0.0.1:3000/try-on/
```

For the production server:

```bash
npm run deploy:check
npm start
# PORT=3002 npm start for a different port
```

The build generates the two MediaPipe workers and matching WASM files. Both
original official models are included. No AI key, paid API, database account or
new dependency is required. A private local `.env` is ignored by Git; default
asset paths work without it. Never place secrets in `NEXT_PUBLIC_` variables.

## What to demonstrate

1. Upload a clear portrait. Real MediaPipe segmentation finds the hair locally;
   the original mask and colour cache support fast shade changes.
2. Window 2 changes to **Uploaded photo connected** and suggests a starting
   depth using the median Lab lightness of the original hair region. The scale
   is illustrative and not brand-calibrated: confirm or edit the estimate.
3. Choose Burgundy, Copper and Ash Blonde using the quick palette. Both windows
   share the selection. Compare before/after and download the processed PNG.
4. Confirm the starting level. Change hair history, grey coverage, length and
   density; the level assessment and consultation notes respond. Save a summary
   or use **Print / Save PDF**. Formulas remain unapproved and are not supplied.
5. Open Take Photo for normal video, capture, then reuse the still-image pipeline.
   Experimental Live Preview supports continuous VIDEO inference, CPU/GPU
   selection/fallback, measured FPS and a strength slider. Capture stays available.
6. On mobile, switch between Try-On and Colour consultation. State persists;
   hiding a camera pane releases the stream and live worker.

## Source folders

- `src/web/`: screens, React components, styles, camera and on-device AI.
- `src/api/`: backend request handlers, validation schemas and services.
- `src/shared/`: catalogue data, types and pure consultation rules.
- `src/app/`: thin Next.js page/layout and HTTP route entry files.

See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the complete tree,
import boundaries and when a separate NestJS or Python service would help.

## Frontend and backend

Next.js 16.4.6, React 19.3, TypeScript, Tailwind 4, Canvas and MediaPipe 1.2.3.

| Endpoint | Behaviour |
| --- | --- |
| `GET /api/shades/` | Twelve validated illustrative shades and data version |
| `POST /api/guide/calc/` | Zod-validated profile, trusted shade lookup, level assessment and personalised notes |
| `GET /api/health/` | Service health and prototype data version |

The UI uses the guide endpoint and falls back to a clearly labelled local
preview if it is unavailable. Stale requests are cancelled. **Only the shade ID
and hair-profile selections reach the server; images and video do not.** The
catalogue is versioned JSON, not a live database or an admin-managed collection.

## Vercel — updated for the backend

The earlier static `out` deployment has been replaced by the standard Next.js
server build so the API routes work.

| Setting | Value |
| --- | --- |
| Root Directory | `albura-ai-demo` |
| Framework Preset | **Next.js** |
| Node | 22.x |
| Install | `npm ci --include=dev` |
| Build | `npm run build` |
| Output Directory | **`.next`** (configured in `vercel.json`) |
| Environment variables | None required |

Import the GitHub repository and deploy the current commit. If you previously
selected Other or `out`, the repository configuration now explicitly sets
Next.js and `.next`; confirm the Root Directory before redeploying. Serve
the site at the domain root over HTTPS for camera permissions. The GitHub integration reported successful Vercel builds for structure commit
`fb5f05b` in both linked projects (`albura-ai`, `albura-ai-demo`). The public domain
[albura-ai.vercel.app](https://albura-ai.vercel.app/) passed 24 browser checks
covering the backend, photo consultation, mobile layout, PDF and virtual-webcam capture. No Vercel credentials are stored in this workspace.
Choose hosting that permits the intended commercial/interview use.

References: [Vercel framework settings](https://vercel.com/docs/builds/configure-a-build),
[Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## Submission and scope

- [Interview explanation and code walkthrough](docs/INTERVIEW_GUIDE.md)
- [Scope review and dated test record](docs/INTERVIEW_SUBMISSION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Editorial redesign and asset notes](docs/DESIGN_UPDATE.md)
- [Photo edge correction](docs/EDGE_COVERAGE_FIX.md)
- [Live colour correction](docs/LIVE_COLOUR_FIX.md)
- [Earlier three-mode implementation](docs/LIVE_CAMERA_REPORT.md)

The supplied PDF budgets **57 person-days / 5–7 weeks** for the full production
system. The two-day prototype does not claim the approved 180-shade card,
50-product catalogue, Postgres, authenticated admin, approved chemical rules,
physical-device certification or guaranteed colour fidelity. Those need client
data, technical sign-off and a production delivery phase. This demo demonstrates
the end-to-end interaction and engineering foundation without inventing them.
