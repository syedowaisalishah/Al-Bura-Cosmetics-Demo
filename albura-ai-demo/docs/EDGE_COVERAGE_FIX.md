# Burgundy edge coverage correction

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
