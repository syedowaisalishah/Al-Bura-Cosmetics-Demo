# Explain Al Bura in your interview

Updated 24 November 2026. Read this first, then open the linked source files.
This describes the current implementation; older phase reports are historical.

## Your 30-second explanation

> “I built a hair-colour try-on where someone can upload a photo, take a photo,
> or try an experimental live camera. The AI identifies the hair, and a colour
> engine applies the chosen shade while keeping the original lighting and texture.
> Photos stay in the browser. A second panel uses the selected shade and confirmed
> starting level to provide a consultation summary. It is a working prototype;
> official shade calibration and production administration are future work.”

## Explain the architecture without technical terms

Think of four jobs inside one application:

| Part | Plain-language explanation | Code |
| --- | --- | --- |
| Frontend | The counter: upload, camera, palette and results | `src/web/` |
| Browser AI | The editor: finds hair and changes its appearance on your device | `src/web/ai/` |
| Backend | The checker: validates the selected shade and profile, then calculates the consultation | `src/api/` |
| Shared code | The common reference: shade records, definitions and consultation rules | `src/shared/` |

`src/app/` is the entrance: Next.js uses its page and route files to connect URLs
to those jobs. Frontend and backend deploy together. There are no separate
NestJS or Python services in the current app.

## What each technology does

| Technology | Why it is here |
| --- | --- |
| Next.js | Page routing, initial page rendering, API endpoints and the deployment build |
| React + TypeScript | Interactive components, shared state and checked code contracts |
| Tailwind + custom CSS | Responsive styling, including the mobile studio tabs |
| MediaPipe Tasks Vision | Runs the existing hair and selfie segmentation models |
| WebAssembly + Web Workers | Browser inference runtime and a background thread for model inference |
| Canvas 2D + CIELAB maths | Draws previews and changes colour while retaining source lightness/detail; this part is custom image processing |
| Zod | Checks actual incoming API values at runtime, including rejecting unknown fields |
| Versioned JSON | Stores twelve illustrative shades; it is not a database |
| Vercel | Hosts the Next.js pages, static AI assets and backend functions |

The installed versions are recorded in [package.json](../package.json) and
`package-lock.json`. Reproducible, tested dependencies matter more for the demo
than upgrading packages immediately before an interview.

A **mask** is a pixel map of where colour may be applied. A **cache** saves work
that can be reused. **CIELAB** separates lightness (`L`) from colour (`a`, `b`),
which helps retain shadows while changing the tint. `IMAGE` analyses a still;
`VIDEO` analyses frames with increasing timestamps.

## Walk through the code in this order

1. [TryOnPage](../src/web/screens/TryOnPage.tsx) supplies the validated catalogue
   to the provider. The initial page reads it directly; it does not call its own
   `/api/shades/` endpoint.
2. [TryOnProvider](../src/web/components/try-on/TryOnProvider.tsx) owns the selected
   shade, hair profile, photo estimate and confirmation. Both panels read it.
3. [HairTryOn](../src/web/components/try-on/HairTryOn.tsx) coordinates photo
   preparation, AI analysis, caching, shade rendering and download.
4. [hair-segmentation](../src/web/ai/hair-segmentation.ts),
   [mask-utils](../src/web/ai/mask-utils.ts) and
   [hair-recolor](../src/web/ai/hair-recolor.ts) implement detection, boundary
   refinement and colour application respectively.
5. [useGuideAssessment](../src/web/hooks/useGuideAssessment.ts) sends profile
   metadata to the backend, cancels stale requests and exposes a labelled local
   fallback. [TechnicalGuide](../src/web/components/guide/TechnicalGuide.tsx)
   displays the consultation and exports its summary.
6. [API route](../src/app/api/guide/calc/route.ts) →
   [HTTP handler](../src/api/handlers/guide.ts) →
   [service](../src/api/services/guide-service.ts) →
   [schema](../src/api/schemas/guide-request.ts) and
   [shared rules](../src/shared/guide/guide-rules.ts) show the server flow.

## Trace one uploaded photo

`File → preparePhoto → IMAGE worker → refined hair mask → colour cache → preview`

Upload and Take Photo both enter `processPhoto(file, source)`. Capture uses the
original video feed, applies the selected mirror setting and stops the camera.
Each new still image runs one analysis pass through **both existing models**:
HairSegmenter identifies hair; the selfie model adds hair evidence and skin
protection. This is inference with pretrained models, not training a new model.

The cache keeps original pixels, the refined mask and their Lab colour values.
Changing shades reruns colour rendering, not AI segmentation. Each render starts
from the original, so successive shades do not accumulate paint. Before/after
and PNG download use the same processed result.

`photo-analysis.ts` estimates starting depth from original masked hair pixels.
The scale is illustrative, affected by lighting and existing dye. It cannot
identify the person's true natural roots; confirmation or manual correction is
required for consultation export.

## Explain Window 2 and the backend

Window 1 answers “How could it look?” Window 2 answers “How does my selected shade
compare with my starting level, and what should I discuss with a stylist?”

A photo changes the estimated starting level. A shade changes the target level
and reflection. Profile changes update the consultation notes. Live camera
shares the shade, but does not continuously estimate a starting level; capture a
still or set it manually. Window 2 uses deterministic rules, not a second AI or LLM.

For example, Burgundy is level 5. With starting level 4, the difference is
`5 − 4 = +1`. That is a software comparison, not a promise of chemical lift.
The server receives this kind of request:

```json
{
  "shadeId": "demo-10",
  "naturalLevel": 4,
  "hairHistory": "virgin",
  "greyPercentage": "none",
  "hairLength": "shoulder",
  "hairDensity": "medium"
}
```

`POST /api/guide/calc/` validates it, looks up its own trusted shade record and
returns an assessment, notes and data version. There are no image bytes in the
request. `GET /api/shades/` exposes the sample catalogue; `GET /api/health/`
reports service status. The public demo APIs do not save profiles or require login.

## Questions you may be asked

**Why use Next.js for the backend too?** Three small endpoints fit the current
application. One deployment keeps the UI and API contracts together. Backend
responsibilities are separated in `src/api`, so extracting a service later is possible.

**Why not NestJS and Python now?** NestJS would help with a larger business API,
admin, roles or multiple client apps. Python would help prepare datasets, train
and evaluate models, or run a future server inference service. Server inference
needs image uploads and network time. Neither framework alone improves hair edges.

**Why is live experimental?** It processes changing frames repeatedly instead of
caching one photo. A separate VIDEO worker calls `segmentForVideo`, with one frame
in flight, GPU/CPU selection, fallback and mask/colour smoothing. The scheduler
caps analyses at eight per second; measured displayed FPS may be lower. GPU
currently accelerates segmentation, not the Canvas colour engine. Take Photo
provides the more stable path.

**Why can original colour remain around edges?** Fine strands or highlighted curls
may have weak hair confidence. Safer boundaries can miss them; aggressive expansion
can colour skin or background. Better work includes annotated portraits, boundary
metrics, improved matting and evaluation across devices and lighting. Paid SDKs
need a measured comparison on the same images before replacement is justified.

**What would make this production-ready?** Approved measured shade data, an
annotated evaluation set, physical-device/browser QA, database and authenticated
admin publishing, monitoring, and technical approval for any formulation feature.
There is no database/admin, trained custom model, guaranteed colour match or
approved chemical recipe in this prototype.

## A three-minute demo

1. Upload a clear portrait; explain on-device hair detection.
2. Choose Burgundy, Copper and Ash Blonde; explain mask/cache reuse.
3. Compare before/after and download the PNG.
4. Point to the connected photo in Window 2; confirm or correct its starting level.
5. Change the level/history and show the updated service-checked consultation.
6. Save the consultation summary or Print / Save PDF.
7. Show Take Photo; show live FPS only after testing the presentation device.
8. Finish with mobile layout and the specific production work remaining.

From `albura-ai-demo/`, use `npm run dev` for development. `npm run deploy:check`
runs TypeScript, lint, tests, the production build and asset checks. Use `npm start`
after building. Test your physical camera and keep upload available as a fallback.

For the complete flow diagram, read [ARCHITECTURE.md](ARCHITECTURE.md). For folder
boundaries, read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md). For preparation,
read [DEMO_GUIDE.md](DEMO_GUIDE.md).
