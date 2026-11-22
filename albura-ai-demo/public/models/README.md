# Google MediaPipe HairSegmenter

- Artifact: `hair_segmenter.tflite`, official float32 version 1, unmodified.
- Download: https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite
- Documentation: https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter#hair-segmentation-model
- Google model card: https://storage.googleapis.com/mediapipe-assets/Model%20Card%20-%20Hair%20Segmentation.pdf
- License: **Apache License 2.0**, as stated by Google's model card. Full license and model card are included alongside this file.
- Retrieved: **2026-11-22**.
- Size: **781,618 bytes**.
- SHA-256: `2628cf3ce5f695f604cbea2841e00befcaa3624bf80caf3664bef2656d59bf84`.
- TFLite FlatBuffer identifier: `TFL3`; schema version: `3`.
- Raw input shape: `[1, 512, 512, 4]`, float32. Use the ImageSegmenter image API; do not build a three-channel tensor manually.
- Raw output shape: `[1, 512, 512, 2]`, float32.
- Associated `labels.txt`, independently extracted from this exact binary: `background`, then `hair`.

Category mask values are class indices: `0 = background`, `1 = hair`.
The hair confidence mask is `confidenceMasks[1]`, with probabilities in `[0, 1]`.
These are different representations; a category index is not a confidence value.

`npm run model:verify` checks the checksum, length, FlatBuffer identifier/schema,
tensor shapes, and embedded labels without inference. `npm run model:download`
restores the official pinned artifact, validating before replacing an existing file.
HTML responses and mismatched binaries fail explicitly.

The model is intended for close, single-person selfies. Fine strands, headwear,
occlusion, lighting, and distant or multiple subjects can reduce accuracy. A valid
download does not establish real-world segmentation or colour-rendering quality;
those are Phase 2 validation tasks.

## Phase 2: official multiclass confirmation model

The hair-only model can confuse backlit background textures with hair. A second
real AI model verifies hair and supplies a conservative skin exclusion; both
models must agree before a pixel can be recoloured. This is not a manual mask.

- File: `selfie_multiclass_256x256.tflite`, float32 version 1, unmodified.
- Source: https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite
- Google model card: https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Multiclass%20Segmentation.pdf
- License: Apache-2.0, per the included `multiclass-model-card.pdf`; the full
  Apache license is already included as `LICENSE-2.0.txt`.
- Retrieved: 2026-11-22.
- Size: **16,371,837 bytes**.
- SHA-256: `c6748b1253a99067ef71f7e26ca71096cd449baefa8f101900ea23016507e0e0`.
- Float32 input `[1, 256, 256, 3]`; float32 output `[1, 256, 256, 6]`.
- Actual packed labels, checked against this binary: `0 background`, `1 hair`,
  `2 body-skin`, `3 face-skin`, `4 clothes`, `5 others`.

`npm run model:verify` and `npm run model:download` now cover **both** official
artifacts. The browser worker checks runtime labels too. Native masks are copied
before closing MediaPipe results. The returned hair confidence is the minimum
of the two models' hair confidence, with AI skin exclusions set to zero. The
refined mask uses a conservative 0.6 confidence cutoff and inward feathering.
This sacrifices some flyaways/face-crossing strands to reduce unwanted edits.
These models do not guarantee pixel-perfect boundaries on all photographs.
