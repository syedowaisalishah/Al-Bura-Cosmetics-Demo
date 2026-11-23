# Vercel deployment readiness

The current browser-only AI try-on is configured as a Next.js static export.
It requires no backend, cloud inference, database, secret API key or runtime
server. Existing upload/capture, cached hair recolouring and guide behaviour
remain unchanged by deployment preparation.

Update 2026-11-23: the restored experimental live mode is also browser-only.
The build now bundles and verifies **two workers** (IMAGE and VIDEO), with the
same existing models and Vercel settings. `npm run deploy:check` passes under
Node 22.22.1. See [current tests](LIVE_CAMERA_REPORT.md).

## Exact project settings

| Setting | Value |
| --- | --- |
| Root Directory | `albura-ai-demo` (inside this GitHub repository) |
| Framework Preset | Other |
| Node.js Version | 22.x |
| Install Command | `npm ci --include=dev` |
| Build Command | `npm run build` |
| Output Directory | `out` |
| Environment Variables | None required for defaults |

The app-root `vercel.json` supplies the framework/build/install/output settings.
The root directory is selected in Vercel's import/project settings. Keep the
export at the domain root, because worker, model and WASM URLs are absolute.

The build installs development tools explicitly, generates the worker and WASM,
verifies the official model hashes, builds Next.js, and verifies the final export
through `postbuild`. Verification checks:

- Homepage, studio, 404 page and their referenced JS/CSS/icon assets exist.
- Both model binaries have the original pinned hashes, labels and shapes.
- All SDK JS/WASM assets match the installed MediaPipe package byte-for-byte.
- The bundled IMAGE worker exists and WASM files have valid binary headers.
- No `.env`, Git metadata, dependency directory or test source enters the export.

`npm run deploy:check` additionally runs TypeScript, ESLint and all unit tests.
`npm run deploy:verify` checks an already-built export. Build scripts and model
artifacts must be included in Git; generated worker/WASM outputs remain ignored
and are recreated by installation/prebuild. No new dependency was added.

## Private settings and publication

The real local `.env` remains ignored with permissions 600. Root and app Git
ignore rules protect `.env*` and Vercel project linkage. `.vercelignore` excludes
local env files, `.openai` hosting metadata, dependencies/Git metadata,
generated workers/WASM, build output, docs/tests, caches and logs from CLI source
uploads. Installation recreates the generated assets. Public asset-path defaults work without `.env`.

No Vercel credentials or project linkage are configured in this workspace.
Preparing and verifying source is separate from a successful Vercel deployment;
no live URL is claimed. The app README contains the exact dashboard import,
HTTPS-camera checks and missing-asset troubleshooting steps.

Vercel Hobby is limited to eligible personal, non-commercial use. Confirm the
intended company/client demo's eligibility; no paid plan, trial or add-on has
been enabled. [Vercel fair-use rules](https://vercel.com/docs/limits/fair-use-guidelines).

## Verification record

Verified on 2026-11-22 using a new temporary copy of Git-eligible source, with
no `.env`, `node_modules`, generated worker or WASM binaries present initially.
The original workspace/development server was left in place.

- Exact install command `npm ci --include=dev`: **PASS**, 384 packages installed,
  matching worker/WASM generated; npm reported zero vulnerabilities.
- `npm run deploy:check`: **PASS** — TypeScript, lint with zero warnings,
  **36/36 tests**, both model hashes, Next.js production export and postbuild
  deployment verification.
- The clean export contained 49 files, both real model binaries, the IMAGE worker
  and four byte-matching SDK runtime assets. No environment file was needed.
- HTTP smoke check of the clean export: **51/51 routes/assets PASS**, including
  studio/home, JS and WASM MIME types; an unknown path returned 404.
- Temporarily removing a WASM asset from the isolated export correctly caused
  verification to fail. After restoring it, verification passed again.
- Root/app env and Vercel-linkage ignore checks passed; no credential patterns
  were found in commit candidates. The real workspace `.env` remains mode 600.

No live Vercel deployment or physical camera test is claimed by these build checks.
