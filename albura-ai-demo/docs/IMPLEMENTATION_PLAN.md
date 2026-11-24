# Delivery boundaries

Historical delivery plan. Use the [documentation index](README.md) and
[interview guide](INTERVIEW_GUIDE.md) for the current implementation and architecture.

Phases 1–5 are implemented locally. See `PHASE_5_REPORT.md` for the final audit
and checks. `CAMERA_CAPTURE_REPORT.md` describes the capture workflow and
`PHASE_3_REPORT.md` describes the guide. `PHASE_2_REPORT.md` preserves photo-pipeline
evidence and `VERIFICATION.md` is the historical Phase 1 snapshot.

## Completed

- Phase 1: Next.js/TypeScript architecture, verified official models, theme and
  modular extension points.
- Phase 2: local photo upload, real CPU browser-worker segmentation, conservative
  masking and texture-preserving CIELAB recolouring, twelve illustrative shades,
  comparison, PNG download, errors/retry and resource cleanup.
- Phase 3: shared React Context, manual hair level/history/grey/length/density,
  deterministic demo lift categories, shade synchronization, educational pigment
  chart, review timeline, safety/approval locks, mobile tabs and browser print.

- Camera workflow revision: replace Phase 4 continuous VIDEO inference with
  normal camera preview and on-demand PNG capture. Reuse the IMAGE worker and
  photo cache for all AI processing; retain palette, guide, comparison and PNG
  download. Retake/Stop/mirroring and late-permission cleanup are implemented.

- Phase 5: bounded upper-tone lightness anchor, reflection/chroma protection,
  active hair pixel cache, native mask-shape validation, shade search/family
  filters, comparison views/reset, responsive UI refinements, demonstration and
  limitation docs, and Vercel static-export preparation. Deployment awaits an
  eligible account/credentials; no deployed URL or production readiness is claimed.

Guide input changes neither rerun segmentation nor change the processed image.
Changing shade recolours from the existing cache without another model analysis.

## Brand approval work — pending approved inputs

Obtain the missing scope PDF, reconcile the visual references, import an approved
shade card/Lab values, and obtain brand-approved technical rules. All developer
strengths, chemical quantities, ratios, timings and bleach instructions remain
locked. No generic defaults may become approved instructions automatically.

## Further validation — pending a concrete brief

Physical desktop/mobile camera validation, broader annotated-mask evaluation,
real-device Safari/Firefox testing, performance
and accessibility work, brand review, and recovery of the existing hosting
connection before publication. These remain suggestions for future work.

Admin, database, authentication, GPU rendering and production
inference services remain outside the current delivery. Maintain the $0
browser-only path and photo privacy. Virtual colour cannot predict dye outcomes.
