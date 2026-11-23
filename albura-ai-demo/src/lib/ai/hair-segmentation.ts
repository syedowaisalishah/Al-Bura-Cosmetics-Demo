import type { ImageSegmenter, ImageSegmenterResult } from "@mediapipe/tasks-vision";
import { loadHairSegmenter } from "@/lib/ai/mediapipe";
import { combineHairConfidence, combinePhotoHairConfidence, HAIR_CATEGORY_INDEX, resizeConfidenceMask, skinExclusion } from "@/lib/ai/mask-utils";
import type { HairSegmentationResult } from "@/types/try-on";
export type SegmentHair = (source: HTMLImageElement | HTMLCanvasElement | ImageBitmap) => Promise<HairSegmentationResult>;

/** Copy native mask values during their valid lifetime. */
function copyResult(result: ImageSegmenterResult): HairSegmentationResult {
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
    return { width, height, categoryMask, hairConfidenceMask, skinConfidenceMask, processingTimeMs: 0 };
}

/** VIDEO uses the callback API to avoid SDK-owned mask clones each frame. */
export function segmentWithModel(model: ImageSegmenter, source: ImageBitmap, timestampMs?: number): HairSegmentationResult {
  const started = performance.now();
  let owned: HairSegmentationResult | undefined;
  if (timestampMs === undefined) {
    const result = model.segment(source);
    try { owned = copyResult(result); } finally { result.close(); }
  } else {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) throw new Error("A valid millisecond timestamp is required.");
    model.segmentForVideo(source, timestampMs, (result) => { owned = copyResult(result); });
  }
  if (!owned) throw new Error("The hair model returned no segmentation result.");
  owned.processingTimeMs = performance.now() - started;
  return owned;
}

/** The same real dual-model evidence and skin protection are used in both modes. */
export function segmentWithModels(model: ImageSegmenter, guard: ImageSegmenter, source: ImageBitmap, timestampMs?: number) {
  const result = segmentWithModel(model, source, timestampMs), confirmation = segmentWithModel(guard, source, timestampMs);
  const confidence = confirmation.width === result.width && confirmation.height === result.height ? confirmation.hairConfidenceMask
    : resizeConfidenceMask(confirmation.hairConfidenceMask, confirmation.width, confirmation.height, result.width, result.height);
  if (!confirmation.skinConfidenceMask) throw new Error("The safety model returned no skin confidence masks.");
  const skin = resizeConfidenceMask(confirmation.skinConfidenceMask, confirmation.width, confirmation.height, result.width, result.height);
  result.hairConfidenceMask = timestampMs === undefined
    ? combinePhotoHairConfidence(result.hairConfidenceMask, confidence, skin, result.width, result.height)
    : combineHairConfidence(result.hairConfidenceMask, confidence, skinExclusion(skin, result.width, result.height), result.width, result.height);
  for (let i = 0; i < confidence.length; i++) result.categoryMask[i] = result.hairConfidenceMask[i] > 0.5 ? 1 : 0;
  result.processingTimeMs += confirmation.processingTimeMs;
  return result;
}

export const segmentHair: SegmentHair = async (source) => {
  const model = await loadHairSegmenter();
  performance.mark("albura:segment-start");
  const started = performance.now(), result = await model.segment(source);
  performance.measure("albura:segmentation", { start: started, end: performance.now() });
  return result;
};
