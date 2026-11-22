import type { HairSegmentationResult } from "@/types/try-on";

export const HAIR_MODEL_LABELS = ["background", "hair"] as const;
export const HAIR_GUARD_LABELS = ["background", "hair", "body-skin", "face-skin", "clothes", "others"] as const;
export const BACKGROUND_CATEGORY_INDEX = 0;
export const HAIR_CATEGORY_INDEX = 1;
export interface MaskRefinementOptions { confidenceThreshold: number; featherRadiusPx: number }
export interface RefinedHairMask { width: number; height: number; alpha: Float32Array; hairPixels: number }

export function smoothstep(low: number, high: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

/** Pixel-centre bilinear sampling; independent X/Y scales avoid aspect-ratio drift. */
export function resizeConfidenceMask(source: Float32Array, sw: number, sh: number, width: number, height: number) {
  if (![sw, sh, width, height].every((v) => Number.isInteger(v) && v > 0) || source.length !== sw * sh) throw new Error("Invalid mask dimensions.");
  const output = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const sy = Math.max(0, Math.min(sh - 1, (y + 0.5) * sh / height - 0.5));
    const y0 = Math.floor(sy), y1 = Math.min(sh - 1, y0 + 1), fy = sy - y0;
    for (let x = 0; x < width; x++) {
      const sx = Math.max(0, Math.min(sw - 1, (x + 0.5) * sw / width - 0.5));
      const x0 = Math.floor(sx), x1 = Math.min(sw - 1, x0 + 1), fx = sx - x0;
      const top = source[y0 * sw + x0] * (1 - fx) + source[y0 * sw + x1] * fx;
      const bottom = source[y1 * sw + x0] * (1 - fx) + source[y1 * sw + x1] * fx;
      const value = top * (1 - fy) + bottom * fy;
      output[y * width + x] = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    }
  }
  return output;
}

/** Expand only AI-predicted skin exclusions, never the hair mask. */
export function skinExclusion(skin: Float32Array, width: number, height: number) {
  if (skin.length !== width * height) throw new Error("Skin mask dimensions are invalid.");
  const excluded = new Uint8Array(skin.length);
  const radius = Math.max(1, Math.round(Math.max(width, height) / 512));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (skin[y * width + x] < 0.12) continue;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < width && yy >= 0 && yy < height) excluded[yy * width + xx] = 1;
    }
  }
  return excluded;
}

/** Recover connected strands when one real model is confident and the other is uncertain.
 * Strong two-model agreement anchors recovery; skin and unsupported background never grow.
 */
export function combineHairConfidence(primary: Float32Array, confirmation: Float32Array, excluded: Uint8Array, width: number, height: number) {
  const area = width * height;
  if (![width, height].every((v) => Number.isInteger(v) && v > 0)
    || primary.length !== area || confirmation.length !== area || excluded.length !== area) throw new Error("Hair evidence dimensions do not match.");
  const result = new Float32Array(area), visited = new Uint8Array(area), queue = new Uint32Array(area);
  let head = 0, tail = 0;
  for (let i = 0; i < area; i++) {
    if (excluded[i] || !Number.isFinite(primary[i]) || !Number.isFinite(confirmation[i])) continue;
    result[i] = Math.max(0, Math.min(1, primary[i], confirmation[i]));
    if (result[i] >= 0.75) { visited[i] = 1; queue[tail++] = i; }
  }
  while (head < tail) {
    const i = queue[head++], x = i % width, y = Math.floor(i / width);
    result[i] = Math.max(0, Math.min(1, Math.max(primary[i], confirmation[i])));
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
      const next = yy * width + xx;
      if (visited[next] || excluded[next]) continue;
      const low = Math.min(primary[next], confirmation[next]), high = Math.max(primary[next], confirmation[next]);
      if (low >= 0.3 && high >= 0.75 && Number.isFinite(high)) { visited[next] = 1; queue[tail++] = next; }
    }
  }
  return result;
}

/** Keep connected fine edges but discard tiny disconnected high-confidence specks. */
function removeSmallRegions(alpha: Float32Array, width: number, height: number) {
  const visited = new Uint8Array(alpha.length), queue = new Int32Array(alpha.length);
  const minimumArea = Math.max(6, Math.round(alpha.length * 0.00003));
  for (let start = 0; start < alpha.length; start++) {
    if (visited[start] || alpha[start] === 0) continue;
    let head = 0, tail = 1; queue[0] = start; visited[start] = 1;
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (!visited[next] && alpha[next] > 0) { visited[next] = 1; queue[tail++] = next; }
      }
    }
    if (tail < minimumArea) for (let j = 0; j < tail; j++) alpha[queue[j]] = 0;
  }
}

/** Separable small-radius blur with zero outside the image. */
function featherInside(alpha: Float32Array, width: number, height: number, radius: number) {
  const horizontal = new Float32Array(alpha.length), result = new Float32Array(alpha.length);
  const size = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x <= radius && x < width; x++) sum += alpha[y * width + x];
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] = sum / size;
      if (x - radius >= 0) sum -= alpha[y * width + x - radius];
      if (x + radius + 1 < width) sum += alpha[y * width + x + radius + 1];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = 0; y <= radius && y < height; y++) sum += horizontal[y * width + x];
    for (let y = 0; y < height; y++) {
      const i = y * width + x;
      // Never expand a mask onto pixels classified as non-hair.
      result[i] = Math.min(alpha[i], sum / size);
      if (y - radius >= 0) sum -= horizontal[(y - radius) * width + x];
      if (y + radius + 1 < height) sum += horizontal[(y + radius + 1) * width + x];
    }
  }
  return result;
}

export function refineHairMask(segmentation: HairSegmentationResult, width: number, height: number, options: Partial<MaskRefinementOptions> = {}): RefinedHairMask {
  const threshold = Math.max(0.5, Math.min(0.85, options.confidenceThreshold ?? 0.6));
  const probabilities = resizeConfidenceMask(segmentation.hairConfidenceMask, segmentation.width, segmentation.height, width, height);
  const alpha = probabilities.map((p) => p <= threshold ? 0 : smoothstep(threshold, Math.max(0.85, threshold + 0.05), p));
  removeSmallRegions(alpha, width, height);
  const radius = Math.max(0, Math.min(4, Math.round(options.featherRadiusPx ?? Math.max(width, height) / 512)));
  const refined = radius ? featherInside(alpha, width, height, radius) : alpha;
  let hairPixels = 0;
  for (const value of refined) if (value > 0.1) hairPixels++;
  return { width, height, alpha: refined, hairPixels };
}

export function createMaskOverlay(source: ImageData, mask: RefinedHairMask) {
  if (source.width !== mask.width || source.height !== mask.height) throw new Error("Mask overlay dimensions do not match the photo.");
  const output = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  for (let i = 0; i < mask.alpha.length; i++) {
    const alpha = mask.alpha[i] * 0.55, p = i * 4;
    output.data[p] = source.data[p] * (1 - alpha) + 40 * alpha;
    output.data[p + 1] = source.data[p + 1] * (1 - alpha) + 200 * alpha;
    output.data[p + 2] = source.data[p + 2] * (1 - alpha) + 170 * alpha;
  }
  return output;
}
