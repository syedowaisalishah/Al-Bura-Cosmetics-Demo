# Project structure

The current application is one full-stack Next.js project. Frontend and backend
code have separate source folders; both are built and deployed together. React
is the UI library used by Next.js, not a second frontend application.

For a shorter explanation you can practise aloud, use
[INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md). Start a code review there, then use this
tree to locate the implementation.

```text
Al-Bura-Cosmetics-Demo/
├── albura-ai-demo/               # Existing Vercel project root
│   ├── src/
│   │   ├── app/                  # Next.js framework entry points
│   │   │   ├── layout.tsx        # Delegates to the web layout
│   │   │   ├── page.tsx          # Delegates to HomePage
│   │   │   ├── try-on/page.tsx   # Delegates to TryOnPage
│   │   │   ├── icon.svg
│   │   │   └── api/              # Thin HTTP route adapters
│   │   │       ├── health/route.ts
│   │   │       ├── shades/route.ts
│   │   │       └── guide/calc/route.ts
│   │   ├── web/                  # Frontend and browser processing
│   │   │   ├── screens/          # HomePage and TryOnPage
│   │   │   ├── components/       # Layout, try-on, guide and UI components
│   │   │   ├── styles/           # Global, studio, camera and guide CSS
│   │   │   ├── ai/               # MediaPipe clients/workers and recolouring
│   │   │   ├── hooks/            # Consultation HTTP requests and local fallback
│   │   │   ├── lib/              # Camera, colour maths and UI helpers
│   │   │   ├── types/            # Browser/worker contracts
│   │   │   └── layout.tsx        # Document shell and local font setup
│   │   ├── api/                  # Backend implementation
│   │   │   ├── handlers/         # HTTP request/response logic
│   │   │   ├── schemas/          # Zod request validation
│   │   │   └── services/         # Trusted catalogue lookup and assessment
│   │   └── shared/               # Used by web and API
│   │       ├── data/             # Demo catalogue and public data version
│   │       ├── guide/            # Pure rules, reference values and notes
│   │       └── types/            # Shade and consultation contracts
│   ├── public/                   # Models, WASM, workers, fonts and imagery
│   ├── scripts/                  # Asset bundling, model/build verification
│   ├── tests/                    # Vision, camera, rules and API checks
│   ├── docs/
│   ├── .env                      # Private, ignored local settings
│   └── package.json
└── deliverables/                 # Local PDF/diagram deliverables
```

## Why `src/app/api` and `src/api` both exist

Next.js discovers HTTP routes through `app/**/route.ts`. Moving those entry
files to an arbitrary top-level `api` folder would stop Next.js from registering
them. The entry files therefore stay in `src/app/api`; they delegate to the
implementation in `src/api`. Likewise, Next.js page/layout entries delegate to
`src/web`, where the UI actually lives.

- `web` imports browser code and shared contracts. It calls the backend through
  `/api/...`; it does not import API implementations.
- `api` imports shared data/rules/contracts. It does not import UI components,
  camera code or browser workers.
- `shared` imports neither `web` nor `api`. Its rules can run in the server
  assessment and the labelled local fallback.
- `app` is the framework bridge. Future server-side page data loading can live
  at that boundary and pass data to the UI.
- Use `@/web`, `@/api` and `@/shared` for cross-folder imports. ESLint guards the
  direction of those imports.

Within `web`, `TryOnProvider` owns state and `useGuideAssessment` owns network
coordination. Photo pixels/masks stay in the photo pipeline, not global profile
state. Within `api`, handlers own HTTP, schemas validate values, and services run
trusted business operations. `HairProfile` and `GuideRequest` in shared types
describe the input contract without importing backend implementation into the UI.

## Why keep the current stack?

Next.js route handlers already provide the three small backend endpoints. The
browser performs hair segmentation and recolouring. Keeping one deployment
avoids a second authentication/CORS boundary and an extra image upload path.
The existing Vercel root directory, URLs and build commands remain valid.

### When NestJS would help

A separate NestJS backend becomes useful when admin/authentication, complex
product workflows, background jobs or several API clients justify independent
modules and releases. It can replace the HTTP/service backend while preserving
frontend contracts. NestJS is supported on Vercel; its hosting limits still need
to be evaluated for the workload. It is not required to obtain backend APIs.

### When Python would help

Python is useful for dataset preparation, model training/evaluation or a
separately approved high-quality still-photo rendering service. A server-image
service adds upload latency, retention/security requirements and compute cost.
It does not directly accelerate the current browser camera or fix its eight-FPS
scheduler limit. The browser AI remains in `src/web/ai` for the current app.

If those requirements arrive, a possible future service layout is:

```text
apps/web/             # Next.js frontend
apps/api/             # NestJS business API
services/vision/      # Python inference/training service
packages/contracts/   # Shared API contracts
```

These future services are not empty scaffolds in this repository. Create them
when there is a real workload, model and deployment plan. Moving the current
Vercel root at that point also requires updating project settings.

References:
- [Next.js project organization](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js backend for frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs)

Historical PDFs and phase reports describe their recorded source commits. Their
old paths are not current folder instructions; use this file for navigation.

## Refactor verification

The 24 November state/network separation passed the full deployment check with
52 unit tests and 16 focused production-browser checks. See
[ARCHITECTURE.md](ARCHITECTURE.md#verification-and-production-roadmap) for that
run's scope. The original 23 November folder move was verified as follows:

- TypeScript, zero-warning ESLint, all 52 unit tests and production/deployment
  verification passed with the new paths.
- 49 native MediaPipe mode/workflow checks, 24 consultation/API/capture checks
  and 22 layout/navigation checks passed against the production build.
- Dedicated lint probes rejected web-to-API, API-to-web and shared-to-API
  imports, while allowing shared frontend types.
- The 15 moved AI/CSS files retained their exact algorithm/style content after
  import path normalization. Worker output URLs, API URLs and Vercel root stayed
  unchanged. Browser tests used real portraits and a virtual webcam; physical
  device certification remains separate QA work.
