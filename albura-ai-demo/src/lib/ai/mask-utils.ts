/** Verified against Google's HairSegmenter documentation AND packed labels.txt. */
export const HAIR_MODEL_LABELS = ["background", "hair"] as const;
export const BACKGROUND_CATEGORY_INDEX = 0;
export const HAIR_CATEGORY_INDEX = 1;

/** Reserved for Phase 2; no thresholding or mask processing is implemented. */
export interface MaskRefinementOptions {
  confidenceThreshold: number;
  featherRadiusPx: number;
}
