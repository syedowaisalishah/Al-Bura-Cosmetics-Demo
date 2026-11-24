# Al Bura interview submission — 23 November 2026

This is the dated scope/submission record. For the current explanation and code
reading order, use [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) and the
[documentation index](README.md).

## What Window 2 does

Window 1 answers **“What would this shade look like on my hair?”** Window 2
answers **“How does this shade compare with my starting hair, and what should
I discuss with a professional?”**

The supplied Al Bura developer scope, sections 5 and 6, explicitly connects the
original-photo hair mask to an estimated starting level, then asks the user to
confirm it. The earlier demo omitted this handoff and displayed a long manual
reference. The updated demo implements it:

1. Real MediaPipe IMAGE segmentation identifies hair in the original photo.
2. Original, high-confidence hair pixels provide a weighted median Lab
   lightness. An illustrative level scale suggests depth 1–10. No estimate is
   taken from the recoloured result. Lighting and existing dye affect it; this
   is not a brand-calibrated natural-root measurement.
3. Window 2 shows the connected photo, estimate and confirmation/override.
4. Selected shade, confirmed starting level and hair profile drive the level
   assessment and personalised discussion notes. Changing any input is visible.
5. A strict Next.js API validates that profile and calculates the assessment.
   Photos are never sent. If the service fails, an explicitly labelled local
   preview remains available.
6. Confirmation enables a downloadable JSON summary and browser Print/Save PDF.
   The PDF is a consultation summary, not a chemical application guide.

## A three-minute interview demonstration

| Time | Action | What it proves |
| --- | --- | --- |
| 0:00–0:30 | Open `/try-on/` and upload a well-lit portrait | Real on-device AI and privacy |
| 0:30–1:00 | Point to “Uploaded photo connected”; confirm or edit its starting level | The two windows communicate; estimate is user-confirmed |
| 1:00–1:30 | Choose Burgundy, Copper, then Ash Blonde in the quick palette; compare original/result | Shared shade state, cached mask, texture-preserving colour and corrected curl coverage |
| 1:30–2:00 | Set a different starting level and previously bleached history; change grey/length/density | Deterministic rules, backend validation and visibly changing consultation |
| 2:00–2:20 | Download the processed PNG and save/print the consultation | Complete user outcomes; one-page PDF |
| 2:20–2:45 | Use Take Photo; optionally show Experimental Live and measured FPS | Reusable still pipeline plus honest device-dependent live capability |
| 2:45–3:00 | Show mobile tabs and explain the production roadmap | Responsive UX and realistic delivery judgement |

Suggested explanation: “This is a focused end-to-end prototype, rather than a
claim to have delivered the full production scope in two days. The browser does
the heavy vision work. The server validates consultation inputs. Brand-approved
data and formulations are deliberately a separate production phase.”

## Scope review against the supplied PDF

The PDF budgets **57 person-days**, with two developers and design/QA support
across approximately **5–7 weeks**. Those are its production estimates.

| Scope requirement | Demonstrated now | Production work remaining |
| --- | --- | --- |
| R1/R6 shade-card source and reflection | One validated 12-shade illustrative catalogue, shared selection, codes/reflection, catalogue endpoint | Official 180-shade measurements, approval and DB/admin publishing |
| R2/R3 own-photo natural look | Real local IMAGE/VIDEO segmentation, skin protection, bounded gap recovery, original texture, comparison/download | Annotated 30-photo accuracy evaluation, calibrated fidelity and target-device benchmarks |
| R4 Window 2 | Photo estimate, confirmation, profile, server-checked assessment, personalised notes and PDF/JSON summary | Approved formulas, product quantities, developer mapping and process instructions |
| R5 limits | No unapproved chemical values accepted or produced; unknown API fields are rejected | Signed-off limit tables, controlled timers, auth/roles and audit trails |
| R7 UX and delivery | Responsive two-window workflow, compact reference, errors/fallbacks, tests and handover notes | Final brand assets, content and full production sign-off |
| Website/admin platform | Next.js frontend and three working API handlers | 50-product gallery, Postgres, authenticated CRUD, storage and operational monitoring |

The source PDF is provided separately and remains uncommitted. Its chemical
values are development defaults requiring technical approval; they were not
converted into runnable treatment recipes. No fake 180-shade card, admin portal,
database persistence or certified colour-match score is claimed.

## Current architecture

- Frontend: Next.js 16.4.6, React 19.3, TypeScript, Tailwind/Canvas, responsive
  desktop panels and mobile tabs.
- Vision: the two existing official local MediaPipe models. Upload and capture
  share IMAGE analysis; live has a separate VIDEO worker, GPU/CPU selection,
  fallback, measured FPS, strength and resource cleanup.
- Photo consultation: approximate median-L starting depth from immutable pixels;
  confirmation or manual override; no inference on shade/profile changes.
- Backend: `/api/shades/`, `/api/guide/calc/`, `/api/health/`; strict Zod profile
  validation, trusted shade lookup, bounded JSON and no-store assessment output.
- Data: versioned illustrative JSON, deterministic prototype rules. No database,
  paid API, new model, image-upload endpoint or new package was introduced.
- Deployment: standard Next.js Node/serverless build. Vercel preset **Next.js**,
  root **albura-ai-demo**, `.next` output, explicitly replacing `out`.

## Validation record

- Node **22.22.1**: TypeScript, zero-warning ESLint, **52 tests**, production build
  and deployment verification passed. The verifier checks the two pages, three
  built API handlers, original model hashes, both workers and matching WASM files.
- **49 mode/workflow checks** passed in production Chrome with a virtual webcam
  containing real portrait frames and native MediaPipe inference: upload, cached
  shades, comparison, matching PNG, capture, live/strength, cleanup and mobile.
- **22 consultation checks** passed: photo handoff, confirmation gate, quick
  palette sync, manual override, history/grey/length/density changes, service
  failure/recovery, current summary download, actual PDF output, mobile handoff,
  backend validation and metadata-only API requests. No uncaught browser errors.
- The exact curly portrait produced starting-level estimate **2**, and a blonde
  portrait produced **6**. These are approximate illustrative-scale outputs,
  demonstrating that upload changes Window 2; they are not ground-truth levels.
- The verified consultation PDF is one A4 page and excludes the portrait.
- Physical webcams/phones, Safari/Firefox, calibrated brand colour accuracy,
  24 FPS targets and production operations remain unverified.

Local production preview: `http://127.0.0.1:3002/try-on/`.
Feature commit `4f06c09` and documentation commit `b5cd2cf` were pushed to
`main`; both linked Vercel deployments reported success. The public domain
`https://albura-ai.vercel.app/` subsequently passed 24 native browser checks,
including live backend responses, photo-to-consultation flow, PDF/summary,
mobile layout and capture with a virtual webcam. No deployment credentials
are stored in the repository.

The subsequent editorial redesign of the homepage and studio is described in
[DESIGN_UPDATE.md](DESIGN_UPDATE.md).
