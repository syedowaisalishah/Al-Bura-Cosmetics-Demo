/** Plain owned data; Phase 2 must copy masks before closing MediaPipe results. */
export interface HairSegmentationResult {
  width: number;
  height: number;
  /** Row-major class indices: 0 = background, 1 = hair. */
  categoryMask: Uint8Array;
  /** Row-major hair probabilities in [0, 1], from confidenceMasks[1]. */
  hairConfidenceMask: Float32Array;
  processingTimeMs: number;
}

export type TryOnStatus = "idle" | "loading-model" | "processing" | "ready" | "error";

export interface TryOnState {
  status: TryOnStatus;
  sourceImageUrl: string | null;
  resultImageUrl: string | null;
  selectedShadeId: string | null;
  segmentation: HairSegmentationResult | null;
  error: string | null;
}
