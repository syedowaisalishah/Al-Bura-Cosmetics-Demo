# Burgundy edge coverage correction

## Remaining curl gaps — 2026-11-23

The latest screenshot still showed gold highlights on the lower curls. The
exact 592 × 360 original reproduces this after the earlier correction below.
A representative gold strand at (130, 270) has hair-only confidence **0.147**,
multiclass hair confidence **0.860**, and skin confidence **0.030**. The previous
minimum-agreement rule discarded it even though it lies inside confirmed hair.
Another hair pixel at (320, 330) has both hair scores above 0.75 and skin below
0.12, but was removed by dilation of a neighbouring skin exclusion.

The IMAGE path now uses `combinePhotoHairConfidence`:

- It keeps the existing strong two-model seeds and connected strand recovery.
- It fills only small gaps bounded by existing support where the multiclass
  model already predicts hair at least 0.75 and skin is below 0.06. Opposing
  support must lie within 2–6 pixels, scaled to the image, without crossing skin.
- Very confident multiclass edges and edges supported by both models can join
  immediately adjacent confirmed hair. The support snapshot is immutable, so
  recovered pixels cannot repeatedly grow the mask into a larger region.
- Dilation-only skin exclusions are released only on strong two-model hair
  agreement. Pixels with their own skin confidence at or above 0.12 remain
  excluded, regardless of hair scores.
- The existing inward feather still preserves zero-mask pixels. The source,
  colour engine, palette and mask cache remain unchanged. The VIDEO path keeps
  its existing policy and live blending. No extra AI passes/models are added.

Close-up and mirrored model experiments were evaluated during diagnosis but
were not added: they did not consistently resolve the remaining gaps.

### Current verification

Real native MediaPipe IMAGE inference on the original portrait:

| Location | Before alpha | Corrected alpha | Original RGB | Burgundy RGB |
| --- | ---: | ---: | --- | --- |
| (126, 259) | 0 | 0.997 | 150, 111, 72 | 166, 101, 99 |
| (126, 269) | 0 | 0.992 | 129, 93, 59 | 145, 82, 83 |
| (120, 270) | 0 | 0.984 | 157, 119, 82 | 173, 109, 107 |
| (130, 270) | 0 | 0.990 | 170, 125, 84 | 184, 115, 112 |
| (112, 272) | 0 | 0.969 | 118, 86, 48 | 134, 75, 73 |
| (320, 330) | 0 | 0.656 | 93, 56, 27 | 102, 49, 42 |

- Hair coverage: **29,971 → 31,102 pixels**. Before/after and mask crops were
  visually inspected; gold interior gaps now receive the selected shade.
- Native-skin pixels, sampled face/shoulder/background areas, and all zero-alpha
  pixels had **zero changes**. Skin visible between the curls remains skin.
- Dark and blonde real-portrait regressions also retained every native-skin and
  zero-alpha pixel. A blank frame produced zero hair. Worker output exactly
  matched the independently evaluated confidence refinement on all three photos.
- **48 tests passed**, including new cases for rejected highlight strands,
  unsupported/distant regions, immutable support, native skin preservation,
  dilation-only exceptions and skin barriers. TypeScript, lint and the production
  build/export verification passed.
- **49 production browser checks passed**: upload, three cached shade changes,
  Window 2, comparison, matching PNG download, Take Photo, live mode/strength,
  cleanup and mobile layout. A new photo still causes one IMAGE worker request;
  shade changes do not cause another inference.

Changed files: `src/lib/ai/mask-utils.ts`, `hair-segmentation.ts`,
`src/types/try-on.ts`, `tests/vision.test.ts`, and related architecture/limit docs.
No photo fixtures or generated screenshots are committed.

**Reload and upload the photo again.** An open session retains its previous
worker and cached mask; choosing another shade cannot repair that cached mask.
Fine translucent wisps and semantic model errors remain possible; this is not a
claim of perfect matting for every photograph.

## Earlier correction (historical)

The user's exact 592×360 curly-hair portrait reproduced the uncoloured gold/brown
areas at the bottom. Inspection of both real model outputs found strong hair
confidence from one model and weaker, but positive, evidence from the other.
The earlier strict `min(primary, confirmation)` discarded those strands or made
them almost transparent. For example, a lower curl had confidences 0.924 and
0.354, producing zero matte coverage after the old threshold.

`combineHairConfidence` now anchors strand recovery in strong agreement
(both models at least 0.75). From those anchors, an 8-neighbour traversal follows
only connected evidence where one model is at least 0.75 and both are at least
0.30. It retains the confident real model's value on those strands. Protected
skin pixels block traversal; unsupported background and detached weak evidence
are not promoted. The confidence-to-matte ramp reaches full coverage at 0.85
instead of 0.90, retaining the small inward feather for antialiasing.

This is recovery from actual model evidence, not a geometric head mask, blanket
dilation or a painted colour effect. It uses the same model pair, IMAGE pipeline
and cached recolour engine. No additional models or dependencies were added.

Changed files:

- `src/lib/ai/mask-utils.ts`: connected evidence recovery and matte ramp.
- `src/lib/ai/segmentation.worker.ts`: combine real model confidence before return.
- `src/types/try-on.ts`: document the confidence-map semantics.
- `tests/vision.test.ts`: regression cases for connected gold tips, unsupported
  background, detached evidence, immutable model output and a skin barrier.
- Architecture/limitation docs: describe the updated consensus policy.

Verification:

- Exact portrait: hair coverage increased from 27,187 to 29,971 pixels.
- Five sampled lower-curl locations improved from matte coverage
  0–0.384 to 0.889–1.000 and changed from original brown/gold to Burgundy.
- Production browser flow on the exact portrait: all five sampled curls
  recoloured, Window 2 stayed on Burgundy, one IMAGE analysis ran, protected
  face/shoulder/hand/background patches had zero changes, and no page errors.
- Exact portrait plus brown/dark/blonde regression images: zero changed pixels
  outside the refined mask, zero changes on the model-derived skin exclusions
  and zero changes in the tested background regions.
- `npm test`: 36/36 passed.
- TypeScript, lint and production build passed.

A reload and photo re-upload are required to replace a mask already cached in an
open studio session. Fine wisps with insufficient model evidence can still be
missed; the algorithm deliberately does not colour unconfirmed background.
