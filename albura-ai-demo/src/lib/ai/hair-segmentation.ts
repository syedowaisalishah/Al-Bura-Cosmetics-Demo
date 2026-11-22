import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { loadHairSegmenter } from "@/lib/ai/mediapipe";
import { HAIR_CATEGORY_INDEX } from "@/lib/ai/mask-utils";
import type { HairSegmentationResult } from "@/types/try-on";
export type SegmentHair = (source: HTMLImageElement | HTMLCanvasElement | ImageBitmap) => Promise<HairSegmentationResult>;

/** Runs inside the worker. Copy native buffers before releasing the MediaPipe result. */
export function segmentWithModel(model: ImageSegmenter, source: ImageBitmap): HairSegmentationResult {
  const started = performance.now();
  const result = model.segment(source);
  try {
    const confidence = result.confidenceMasks?.[HAIR_CATEGORY_INDEX], category = result.categoryMask;
    const mask = confidence ?? category;
    if (!mask || !Number.isInteger(mask.width) || !Number.isInteger(mask.height) || mask.width <= 0 || mask.height <= 0) throw new Error("The hair model returned no valid segmentation mask.");
    const { width, height } = mask;
    const hairConfidenceMask = new Float32Array(width * height), categoryMask = new Uint8Array(width * height);
    const probabilities = confidence?.getAsFloat32Array(), categories = category?.getAsUint8Array();
    const bodyMask = result.confidenceMasks?.[2], faceMask = result.confidenceMasks?.[3];
    for (const nativeMask of [category, bodyMask, faceMask]) {
      if (nativeMask && (nativeMask.width !== width || nativeMask.height !== height)) throw new Error("The hair model returned misaligned segmentation masks.");
    }
    const body = bodyMask?.getAsFloat32Array(), face = faceMask?.getAsFloat32Array();
    const skinConfidenceMask = body && face ? new Float32Array(width * height) : undefined;
    if ([probabilities, categories, body, face].some((values) => values && values.length !== width * height)) throw new Error("The hair model returned inconsistent mask dimensions.");
    for (let i = 0; i < hairConfidenceMask.length; i++) {
      const p = probabilities ? probabilities[i] : categories?.[i] === HAIR_CATEGORY_INDEX ? 1 : 0;
      hairConfidenceMask[i] = Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0;
      categoryMask[i] = hairConfidenceMask[i] > 0.5 ? HAIR_CATEGORY_INDEX : 0;
      if (skinConfidenceMask && body && face) {
        if (!Number.isFinite(body[i]) || !Number.isFinite(face[i])) throw new Error("The skin model returned invalid confidence values.");
        skinConfidenceMask[i] = Math.max(0, Math.min(1, Math.max(body[i], face[i])));
      }
    }
    return { width, height, categoryMask, hairConfidenceMask, skinConfidenceMask, processingTimeMs: performance.now() - started };
  } finally { result.close(); }
}

export const segmentHair: SegmentHair = async (source) => {
  const model = await loadHairSegmenter();
  performance.mark("albura:segment-start");
  const started = performance.now(), result = await model.segment(source);
  performance.measure("albura:segmentation", { start: started, end: performance.now() });
  return result;
};
