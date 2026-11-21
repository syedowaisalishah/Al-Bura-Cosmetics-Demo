import type { HairSegmentationResult } from "@/types/try-on";

/** Phase 2 contract only. No inference or simulated result is implemented. */
export type SegmentHair = (
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
) => Promise<HairSegmentationResult>;
