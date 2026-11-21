# Local setup

Checked on **2026-11-22**, Asia/Karachi. See `VERIFICATION.md` for final results.

## Environment

- Ubuntu 26.04 LTS, Linux x86_64.
- Node.js **22.22.1**, npm **9.2.0**, Git **2.53.0**.
- Next.js **16.4.6**, React/React DOM **19.3.0**, TypeScript **5.9.3**,
  Tailwind CSS **4.3.3**. Additional exact versions are in `package-lock.json`.
- `.nvmrc` pins the verified Node version. A small `tsx` development dependency
  runs TypeScript utilities because this machine's Node binary was compiled
  without native TypeScript support. No system configuration changes were needed.

This Node version exceeds the [Next.js minimum of Node 20.9](https://nextjs.org/docs/app/getting-started/installation).
MediaPipe runs in a modern browser with WebAssembly and Canvas 2D, not in Node or
SSR. Start browser testing in current Chrome/Edge; test other browsers before
claiming support. Camera support is deferred and will require HTTPS or localhost.

## First run

From the repository root:

```bash
cd albura-ai-demo
npm ci
npm run model:verify
npm run dev
```

Open `http://127.0.0.1:3000` and `http://127.0.0.1:3000/try-on/`.
No `.env` values, API keys, cloud services, or account setup are required locally.
Fonts use the system stack, so builds do not download webfonts.

`npm ci` regenerates WASM assets via `postinstall`; `predev` and `prebuild` also
sync them. If install lifecycle scripts are disabled, run `npm run assets:sync`.
The generated runtime is ignored by Git and is included in the static build.

## Required checks and production preview

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

`typecheck` generates Next.js route types, then runs `tsc --noEmit`. Lint runs
ESLint separately, because Next.js does not automatically lint during builds.
Build first syncs runtime assets and verifies the model, then produces `out/`.
`npm start` serves the actual static output at `http://127.0.0.1:3000`; choose
another port with `PORT=3001 npm start` on Linux/macOS. Stop servers with Ctrl+C.

## Official model

The real Google float32 v1 HairSegmenter is checked into `public/models`.
Run `npm run model:download` to restore it if absent or corrupted. Downloading
requires internet; build and verification use the included file. Downloads fail
explicitly on HTTP, content, checksum, structure, or label errors. No dummy model
is substituted. See `public/models/README.md` for license, checksum and semantics.

The model factory in `src/lib/ai/mediapipe.ts` is ready for a future browser
component to call. The Phase 1 UI never calls it. It uses local `/wasm` and
`/models/hair_segmenter.tflite`, CPU delegation, and IMAGE mode. It checks exact
labels before returning a handle. Close the handle after use. Initialization
does not perform segmentation; no inference workflow is delivered in Phase 1.

## Free static hosting

The export is compatible with static hosting, without a Node backend. A documented
free option is [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/):
use `albura-ai-demo` as the project root, `npm run build` as the build command,
`out` as the output directory, and Node `22.22.1`. Check current free-plan limits
before publishing. No deployment CLI, paid account, database, or billing service
has been added to the project. A Sites deployment can also serve the same output.

Serve from the domain root so the model/WASM absolute paths resolve. Subpath
hosting (for example a GitHub project page) requires a consistent Next `basePath`
and corresponding asset URL changes before deployment. Do not put photos in
`public/` or commit user images.

## Known missing inputs

There was no scope PDF in the repository. The twelve shade values and D-prefixed
codes are illustrative placeholders, not an approved Al Bura shade card. Brand
technical rules remain absent. These do not block Phase 1; they block claims of
brand fidelity and approved technical recommendations in later phases.
