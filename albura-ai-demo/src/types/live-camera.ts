import type { Shade } from "@/types/shade";

export type LiveDelegate = "CPU" | "GPU";
export type LivePreference = "auto" | LiveDelegate;
/** The receiver owns frame and must close its bitmap after displaying or discarding it. */
export interface LiveFrame {
  frame: ImageBitmap; width: number; height: number; timestampMs: number; shadeId: string;
  hairPixels: number; inferenceMs: number; maskMs: number; recolorMs: number; totalMs: number;
}
export type LiveRequest =
  | { type: "init"; modelPath: string; guardPath: string; wasmPath: string; delegate: LiveDelegate; allowSoftwareGpu: boolean }
  | { type: "frame"; id: number; image: ImageBitmap; timestampMs: number; shade: Shade };
export type LiveResponse =
  | { type: "ready"; delegate: LiveDelegate }
  | { type: "frame"; id: number; result: LiveFrame }
  | { type: "error"; id: number | null; message: string };
