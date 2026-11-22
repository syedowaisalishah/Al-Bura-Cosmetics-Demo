# Phase 3 — technical guide and window synchronization

Implemented and checked on 2026-11-22 (Asia/Karachi). The work-scope PDF was not
present; the repository contains only the two AI model cards. This implementation
follows the supplied Phase 3 brief, without claiming a verified match to missing
Figures 5–7 or treating generic defaults as official Al Bura instructions.

## Shared state

`TryOnProvider` is a React Context provider scoped to `/try-on/`. It exposes:

- `selectedShade`, `naturalLevel`, `hairHistory`, `greyPercentage`, `hairLength`,
  and `hairDensity`, plus controlled update actions.
- `targetLevel`, derived from the selected JSON shade's level.
- `liftDifference = targetLevel - naturalLevel` and a memoized `guideResult`.

The selected shade object comes directly from the existing Zod-validated JSON
array. It retains its identity when guide inputs change, so `HairTryOn`'s colour
render effect does not run for a natural-level/history/length/density/grey change.
The model inference path remains tied to photo analysis only. Changing shade
recolours the existing cached image/mask and updates Window 2 in the same render.
Download remains disabled until the processed result matches the selected shade.

`TryOnStudio` owns responsive layout and keyboard-accessible mobile tabs. Both
panels stay mounted; switching tabs preserves photo URLs, model handles and
cached segmentation. A `#technical-guide` deep link activates the guide tab.
No page reload, backend, database, authentication, paid API or new package was
introduced. Existing `.env` and image privacy behaviour are preserved.

## Rules engine

`generateTechnicalGuide()` in `src/lib/guide/guide-rules.ts` is a pure deterministic
TypeScript function. It validates integer levels 1–10 and the manual input enums,
then applies these rules in precedence order:

| Condition | Unapproved demonstration classification |
| --- | --- |
| Previously bleached and positive lift | Professional consultation required |
| Lift > 6 | Multi-session professional assessment |
| Lift > 4 | Pre-lightening assessment required |
| Lift 3–4 | Significant lift assessment; professional review |
| Lift 1–2 | Moderate lift assessment |
| Lift <= 0 | Deposit/darken assessment |

The result contains only classification, natural/target levels, difference,
selected shade, reflection, warnings and `approvalStatus: 'demo_unapproved'`.
Previously coloured/bleached history and grey inputs add relevant review notices;
length and density update the summary and never calculate product quantities.
No developer strength, chemical amount, ratio, application instruction or duration
is returned. These labels are software categories, not achievable-lift predictions.

## Working interface

- Selected shade summary: name, original demo code, HEX, target/natural levels,
  reflection and its code notation, family, and signed level difference.
- Approximate 1–10 natural-level swatches, clickable buttons and a keyboard range
  slider. The default level 4 is clearly manual, never an AI estimate.
- Controlled hair-history, grey-percentage, length and density selects with a live
  input summary. Demo defaults are explicitly identified.
- Lift assessment with the exact classification and an unapproved-demo notice.
- All ten supplied pigment references, target/start markers, and educational
  blue/orange, violet/yellow, green/red relationships. No correction formula.
- Five review checkpoints numbered 0–4, each with title, description and status.
- Safety reminders and locked developer selection, quantities, mixing ratios,
  timers and bleach procedures under “Awaiting Al Bura Technical Approval”.
- Desktop: Window 1 left, Window 2 right, the shared palette below.
- Mobile: Try-On and Technical Guide tabs with arrow/Home/End keyboard handling;
  hidden panels stay mounted. Guide controls reflow without horizontal overflow.
- Browser print: current assessment, shade and summary, visible unapproved-demo
  notices and all safety locks; no portrait or interactive palette is printed.

All chemical guidance remains unapproved demonstration content. Existing sample
shade values remain illustrative and pending official shade-card approval.

## Files added

- `src/components/try-on/TryOnProvider.tsx`, `TryOnStudio.tsx`
- `src/components/guide/GuideInputs.tsx`, `PigmentChart.tsx`
- `src/lib/guide/guide-reference.ts`
- `src/app/guide.css`
- `tests/guide.test.ts`
- `docs/PHASE_3_REPORT.md`

## Files modified for Phase 3

- `src/types/guide.ts` and `src/lib/guide/guide-rules.ts`
- `src/components/guide/HairLevelSelector.tsx`, `TechnicalGuide.tsx`, `SafetyWarnings.tsx`
- `src/components/try-on/HairTryOn.tsx`
- `src/app/try-on/page.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`
- Root/app READMEs and architecture/setup/implementation documentation.

Phase 2 changes already present in the working tree were retained. No model,
segmentation, recolouring algorithm or shade JSON was replaced in Phase 3.
The new guide stylesheet is separate from the established Tailwind theme to avoid
a stale development-loader cache observed during the first preview check.

## Verification

`npm test` passes **23 tests**: 16 guide checks plus the existing 7 vision checks.
The guide checks cover A–D, zero/negative lift, every threshold boundary, bleached
precedence, selected-shade changes, deterministic recalculation, history/grey
warnings, invalid inputs and the supplied pigment references. One test exercises
all **300** natural/target/history combinations and checks that the result exposes
no chemical formulation output fields.

Chrome 151 browser checks verified:

- A: natural 4, actual JSON target 5 → +1, Moderate lift assessment.
- B: natural 7, target 5 → -2, Deposit/darken assessment.
- C: natural 2, target 9 → +7, Multi-session professional assessment.
- D: previously bleached with positive lift → Professional consultation required.
- E: changing shade updated both window summaries immediately; the processed
  image updated from cache and the photo inference count remained one.
- F: changing natural level, history, grey, length and density updated the guide
  while the processed-image URL stayed identical and inference count stayed one.
- Clickable level swatches; mobile tab keyboard navigation and the guide deep link.
- Desktop 1440 px, tablet 850 px, mobile 390 px: no horizontal overflow.
- Printing called the native browser print action. The generated A4 verification
  PDF contained the live shade/assessment, manual summary, demo notice and five
  locks, with no actionable strengths, quantities, ratios or treatment times.
- Phase 2 regression: real brown/dark/blonde photos, rapid shade changes,
  mouse/keyboard/touch comparison, matching processed-PNG download hash, no-hair
  handling, reset/resource cleanup and cancellation all passed.
- No application console errors, uncaught exceptions or external photo requests
  were observed in these checks. Temporary photos/scripts/exports are outside
  the repository and are not shipped.

Final checks passed: `npm run typecheck`, `npm run lint`, `npm test` (23/23),
`npm run model:verify`, and `npm run build`. Both routes prerender successfully
and the production homepage/studio respond with HTTP 200. The output remains
a browser-only static export. No dependencies were added in Phase 3.

The production export repeated the A–F synchronization, responsive-tab and print
checks successfully. An attached page/worker console check reported zero errors
and confirmed the development-only mask control was absent. The production PDF
also passed the notice/lock/content checks. A static deployment archive was saved
outside the repository; inspection confirmed that it contains no `.env` or tests.

## Remaining work — suggested allocation

No Phase 4 or Phase 5 brief was supplied, so these are suggested next steps:

- **Phase 4:** reconcile the missing scope PDF and figures, replace illustrative
  values with the approved shade card, and have Al Bura's technical team supply
  and approve any formulation rules. Chemical outputs must stay locked until then.
- **Phase 5:** broader hair-mask evaluation, real-device Safari/Firefox testing,
  accessibility/performance hardening, brand sign-off and deployment verification.

Live camera, administration, PostgreSQL, authentication and paid AI services were
not implemented. Hosting still returns “Sites project not found” for the existing
Site ID; no new Site identity or access policy has been substituted.

Run locally: `cd albura-ai-demo && npm ci && npm run dev`, then visit
`http://127.0.0.1:3000/try-on/`. For the static production export, run
`npm run build` followed by `npm start`.
