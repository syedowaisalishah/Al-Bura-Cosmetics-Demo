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
