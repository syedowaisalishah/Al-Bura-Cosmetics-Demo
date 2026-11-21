# Phase boundaries and implementation plan

## Phase 1 — this delivery

- Environment checked; Next.js application created with create-next-app.
- Requested packages installed with lockfile; no paid SDKs or backend services.
- Official HairSegmenter downloaded, pinned, and structurally verified.
- Browser-only CPU WASM model factory configured but not called by the UI.
- Strict types, Zod-validated illustrative shade data, modular two-window shell.
- Setup, architecture, provenance, commands, and verification documented.

**Stop here. Phase 2 requires a new user instruction.** No segmentation inference,
recolouring, working camera, upload workflow, shade selection, before/after
interaction, or guide calculations are implemented. Placeholder controls are
disabled and described as coming later.

## Proposed Phase 2 — not started

1. Validate JPEG/PNG/WebP files and image dimensions; provide local previews and
   release object URLs. Establish a bounded image size and error states.
2. Connect the explicit model factory from a client component or hook. Run
   IMAGE-mode inference, check labels, copy hair probabilities, and close masks.
   Compare several diverse single-person selfies; never infer hair history.
3. Implement Canvas 2D recolouring with retained luminance/texture and feathered
   hair boundaries. Keep original pixels outside the mask unchanged. Explain
   that virtual dark-to-light effects do not predict actual chemical lift.
4. Connect palette selection and before/after comparison with keyboard access.
5. Add user-supplied hair level/history. Implement educational guide logic only
   after receiving the scope PDF and approved rules. Never invent a formula.
6. Add optional camera capture only if the demo time budget permits; request
   camera permission on an explicit action, use HTTPS/localhost, and stop tracks.
7. Check memory, CPU latency, image privacy, mobile layout, difficult hair
   boundaries, and supported browsers; then deploy the functioning demo.

## Suggested remaining time allocation

The total project target is 5–6 hours. Keep the scope small: about 30 minutes for
upload/state, 45–60 for inference/masks, 60–90 for recolouring/comparison, 30–45 for
approved guide integration, and 30–45 for QA/deployment. These are estimates,
not time already spent. Defer camera, GPU tuning, and production services if needed.

## Inputs needed before brand fidelity

- Missing scope PDF and its sample shade values.
- Brand-approved shade card, Lab values where available, technical rules and
  product instructions. Replace the twelve provisional demo shades deliberately.
- Real-world segmentation and recolouring acceptance criteria and example photos
  supplied with permission for local testing.
