import type { Shade } from "@/types/shade";
import type { HairSegmentationResult } from "@/types/try-on";

export interface HairRecolorInput {
  source: ImageData;
  segmentation: HairSegmentationResult;
  shade: Shade;
  intensity: number;
}

/** Phase 2 Canvas 2D contract; no pixels are changed in Phase 1. */
export type RecolorHair = (input: HairRecolorInput) => ImageData;
