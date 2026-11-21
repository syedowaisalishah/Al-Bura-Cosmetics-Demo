import type { ImageSegmenter as ImageSegmenterInstance } from "@mediapipe/tasks-vision";
import { HAIR_MODEL_LABELS } from "@/lib/ai/mask-utils";

export const HAIR_MODEL_PATH = "/models/hair_segmenter.tflite";
export const VISION_WASM_PATH = "/wasm";

/**
 * Explicit browser-only factory. Nothing is imported or executed at SSR time.
 * Phase 2 owns the instance: create once per session and call close() on cleanup.
 * Deliberately not invoked by the Phase 1 UI. No inference happens here.
 */
export async function createHairSegmenter(): Promise<ImageSegmenterInstance> {
  if (typeof window === "undefined") {
    throw new Error("Hair segmentation can only be initialized in a browser.");
  }

  const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM_PATH);
  const segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: HAIR_MODEL_PATH, delegate: "CPU" },
    runningMode: "IMAGE",
    outputCategoryMask: true,
    outputConfidenceMasks: true,
  });

  const labels = segmenter.getLabels();
  if (labels.length !== HAIR_MODEL_LABELS.length || labels.some((label, index) => label !== HAIR_MODEL_LABELS[index])) {
    segmenter.close();
    throw new Error(`Unexpected hair model labels: ${labels.join(", ")}. Expected background, hair.`);
  }

  return segmenter;
}
