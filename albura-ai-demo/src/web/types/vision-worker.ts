import type { HairSegmentationResult } from "@/web/types/try-on";

export type VisionRequest =
  | { type: "init"; modelPath: string; guardPath: string; wasmPath: string }
  | { type: "segment"; id: number; image: ImageBitmap };
export type VisionResponse =
  | { type: "result"; id: number; result: HairSegmentationResult }
  | { type: "ready"; labels: string[] }
  | { type: "error"; id: number | null; message: string };
