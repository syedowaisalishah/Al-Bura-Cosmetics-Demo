# Vercel readiness — full-stack interview demo

The November 23 submission adds Next.js API routes. The earlier static export
settings are historical and must not be used for this version.

- Root directory: `albura-ai-demo`
- Framework: **Next.js** (`framework: "nextjs"` in `vercel.json`)
- Node: **22.x**
- Install: `npm ci --include=dev`
- Build: `npm run build`
- Output: **`.next`**, explicitly set in `vercel.json` to replace the old `out` setting
- Secrets/environment: none needed for the demo defaults; never upload `.env`

The current postbuild check verifies the production build ID, both pages, all
three API handlers, both model hashes, both generated workers and exact SDK
runtime bytes. It also checks public assets for private env/source directories.

After deployment, test `/try-on/`, `/api/health/`, `/api/shades/`, and a guide
calculation from the UI. Verify upload, cached shade changes, photo estimate,
manual level confirmation, PDF/summary export, Take Photo and mobile layouts.
Use HTTPS and a direct browser tab for camera permissions.

The backend uses a versioned illustrative JSON catalogue and deterministic
unapproved assessment rules. There is no database, authentication/admin, image
upload endpoint or paid inference service. It must not be presented as the full
production system from the supplied 57-person-day scope.

The GitHub integration reported successful Vercel deployment checks for feature
commit `4f06c09` in both linked projects: `albura-ai` and `albura-ai-demo`.
Their public-domain endpoints have not been smoke-tested because the public
URL was not supplied. No Vercel credentials are stored here. The tested local
production preview uses port 3002.

Reference: [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build).
