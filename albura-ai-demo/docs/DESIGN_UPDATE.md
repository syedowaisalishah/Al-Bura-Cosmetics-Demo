# Editorial design update

The homepage and studio share a warm ivory, wine and rose palette, locally hosted
Instrument Serif / Manrope typography, consistent controls and responsive layouts.
The homepage includes original editorial imagery, six shade entry cards, an
explanation of the three-step workflow and links into the working studio. Shade
entry links select the same shade in both windows. The studio keeps all three
camera/photo modes, shared shade state, accessible keyboard controls, confirmation,
exports and browser-only image processing.

The compact shade selector keeps the preview close to the page heading. Mobile
layouts retain horizontal shade browsing and separate preview/consultation tabs.
The generated hero is explicitly labelled as editorial imagery, not a try-on result.
No new runtime dependency, AI model or external inference service was added.

## Assets

- Hero: `public/images/colour-story-editorial.webp` (1122 × 1402).
- Created with the built-in image generation tool and compressed to WebP with the
  existing Sharp dependency. The original PNG is retained in the local generated
  image directory; the application serves its own optimized asset.
- Fonts: `public/fonts/`, served locally through `next/font/local`. Instrument
  Serif and Manrope were obtained from Google Fonts; the accompanying SIL Open
  Font License files are included. Browsers do not contact Google Fonts.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: editorial hero photograph for Al Bura Cosmetics hair-colour studio website. Create an original premium beauty editorial portrait, vertical 4:5 composition. One adult South Asian woman, approximately 28 years old, warm medium brown skin, realistic natural pores, minimal elegant makeup, understated ivory linen top, long abundant glossy chestnut brown hair with soft copper undertones in large loose waves. Hair must be the visual hero, with individual strands, natural texture, realistic diffuse highlights and deep shadows, no plastic or painted hair. Woman in a graceful three-quarter pose looking slightly left toward camera, calm confident expression. Hair fills lower half and both shoulders. Full hair crown visible with generous space above, crop at mid-torso, no hands. Studio background warm muted dark wine burgundy, soft directional window light from upper left with gentle falloff, warm editorial colour grade, luxury independent beauty magazine photography, 85mm portrait lens. Camera-level viewpoint, no graphic elements. This is a single standalone photograph, NOT a website screenshot or UI mockup. No text, no letters, no logos, no watermark, no side-by-side, no frames, no bottles, no hair-colour tools.

## Verification

The production check includes TypeScript, ESLint, the existing 52 unit tests,
Next.js production build and asset verification. Browser verification covers
320–1440 px layouts, local font and hero loading, homepage shade links, the three
AI modes, comparison/download, photo-connected consultation and printable output.
Native browser AI is tested with real portraits and a virtual webcam. Physical
device and cross-browser certification remain production QA work.

Verified on the final visual implementation:

- 52 unit tests, TypeScript, zero-warning lint, production build and asset checks.
- 22 layout/navigation checks across 320, 375, 390, 760, 768, 1024 and 1440 px.
- 49 real MediaPipe photo/live/capture workflow checks.
- 24 consultation/backend/export/capture checks; the PDF remains one A4 page.
- A focused mobile-header regression check confirms consultation opens without
  losing the uploaded photo, selected Burgundy shade or shade query parameter.
