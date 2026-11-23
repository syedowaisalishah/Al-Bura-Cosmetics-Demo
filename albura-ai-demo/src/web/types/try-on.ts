/** Owned mask copies; no native MediaPipe resources escape the worker. */
export interface HairSegmentationResult {
  width: number;
  height: number;
  /** Row-major class indices: 0 = background, 1 = hair. */
  categoryMask: Uint8Array;
  /** Hair evidence in [0, 1]; connected recovery, plus bounded multiclass detail recovery for photos. */
  hairConfidenceMask: Float32Array;
  /** Internal multiclass skin exclusion; removed before the worker response. */
  skinConfidenceMask?: Float32Array;
  processingTimeMs: number;
}

export type TryOnStatus = "idle" | "decoding" | "loading-model" | "processing" | "refining" | "rendering" | "ready" | "error";

export interface TryOnState {
  status: TryOnStatus;
  sourceImageUrl: string | null;
  resultImageUrl: string | null;
  selectedShadeId: string | null;
  segmentation: HairSegmentationResult | null;
  error: string | null;
}
