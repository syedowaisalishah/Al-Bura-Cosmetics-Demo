import { clamp, gamutMapLabToRgb, hexToRgb, rgbToLab, type LabColor } from "@/lib/color/color-utils";
import { smoothstep, type RefinedHairMask } from "@/lib/ai/mask-utils";
import type { Shade } from "@/types/shade";

export interface HairColorCache {
  source: ImageData;
  mask: RefinedHairMask;
  /** Only active hair pixels need Lab conversion or recolouring on shade changes. */
  indices: Uint32Array;
  lab: Float32Array;
  mean: LabColor;
  toneAnchor: number;
}
export interface HairColorWorkspace { indices?: Uint32Array; lab?: Float32Array; yieldToBrowser?: boolean }
export interface HairRecolorInput { cache: HairColorCache; shade: Shade; intensity?: number; profile?: "photo" | "live"; signal?: AbortSignal; output?: ImageData; yieldToBrowser?: boolean }
export type RecolorHair = (input: HairRecolorInput) => Promise<ImageData>;
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function checkAbort(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException("Rendering cancelled", "AbortError"); }
const CHUNK = 4096;

/** Cache source-relative colour detail once per photo, never from a recoloured result. */
export async function prepareHairColor(source: ImageData, mask: RefinedHairMask, signal?: AbortSignal, workspace: HairColorWorkspace = {}): Promise<HairColorCache> {
  if (source.width !== mask.width || source.height !== mask.height || mask.alpha.length !== source.width * source.height) throw new Error("Hair mask and photo dimensions do not match.");
  checkAbort(signal);
  let count = 0;
  for (let i = 0; i < mask.alpha.length; i++) if (mask.alpha[i] > 0 && source.data[i * 4 + 3] > 0) count++;
  const indices = workspace.indices && workspace.indices.length >= count ? workspace.indices.subarray(0, count) : new Uint32Array(count);
  const lab = workspace.lab && workspace.lab.length >= count * 3 ? workspace.lab.subarray(0, count * 3) : new Float32Array(count * 3);
  let entry = 0;
  for (let i = 0; i < mask.alpha.length; i++) if (mask.alpha[i] > 0 && source.data[i * 4 + 3] > 0) indices[entry++] = i;
  let weight = 0, l = 0, a = 0, b = 0;
  const lightnessHistogram = new Float64Array(101);
  for (let start = 0; start < count; start += CHUNK) {
    checkAbort(signal);
    for (let j = start; j < Math.min(start + CHUNK, count); j++) {
      const i = indices[j], alpha = clamp(mask.alpha[i], 0, 1), p = i * 4;
      const value = rgbToLab({ r: source.data[p], g: source.data[p + 1], b: source.data[p + 2] });
      lab[j * 3] = value.l; lab[j * 3 + 1] = value.a; lab[j * 3 + 2] = value.b;
      weight += alpha; l += value.l * alpha; a += value.a * alpha; b += value.b * alpha;
      lightnessHistogram[Math.round(clamp(value.l, 0, 100))] += alpha;
    }
    if (workspace.yieldToBrowser !== false) await pause();
  }
  checkAbort(signal);
  if (weight < 20) throw new Error("No clear hair region was detected. Try a closer portrait with visible hair and even lighting.");
  let cumulative = 0, toneAnchor = 0;
  for (; toneAnchor < 100; toneAnchor++) {
    cumulative += lightnessHistogram[toneAnchor];
    if (cumulative >= weight * 0.85) break;
  }
  // An upper diffuse tone avoids brightening coloured highlights because most hair is in shadow.
  toneAnchor = clamp(toneAnchor, l / weight, Math.min(98, l / weight + 24));
  return { source, mask, indices, lab, mean: { l: l / weight, a: a / weight, b: b / weight }, toneAnchor };
}

const logit = (v: number) => Math.log(v / (1 - v));
/** Bounded luminance mapping plus source chroma detail; specular highlights keep their light. */
export const recolorHair: RecolorHair = async ({ cache, shade, intensity = 0.88, profile = "photo", signal, output: reusableOutput, yieldToBrowser = true }) => {
  checkAbort(signal);
  const { source, mask, indices, lab, mean, toneAnchor } = cache;
  if (reusableOutput && (reusableOutput.width !== source.width || reusableOutput.height !== source.height || reusableOutput.data.buffer === source.data.buffer)) throw new Error("Invalid recolour workspace: dimensions must match and original pixels must not alias output.");
  const output = reusableOutput ?? new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  if (reusableOutput) output.data.set(source.data);
  const strength = Number.isFinite(intensity) ? clamp(intensity, 0, 1) : 0;
  if (strength === 0) return output;
  const target = shade.lab ?? rgbToLab(hexToRgb(shade.hex));
  // Camera exposure is part of the scene lighting. A bright target must not turn
  // dim, low-contrast hair into a uniformly bright patch at the mask boundary.
  const live = profile === "live";
  const desiredTone = clamp(toneAnchor + clamp((target.l - toneAnchor) * 0.85, live ? -16 : -32, live ? 8 : 25), 2, 98);
  const shift = clamp(logit(desiredTone / 100) - logit(clamp(toneAnchor / 100, 0.01, 0.99)), live ? -.65 : -1.8, live ? .4 : 1.2);
  const targetChroma = Math.hypot(target.a, target.b);
  const chromaScale = targetChroma > 38 ? 38 / targetChroma : 1;
  const highlightStart = Math.max(65, Math.min(82, mean.l + 22));
  for (let start = 0; start < indices.length; start += CHUNK) {
    checkAbort(signal);
    for (let j = start; j < Math.min(start + CHUNK, indices.length); j++) {
      const i = indices[j], p = i * 4, alpha = clamp(mask.alpha[i], 0, 1) * strength;
      const originalL = lab[j * 3], originalA = lab[j * 3 + 1], originalB = lab[j * 3 + 2];
      const unitL = clamp(originalL / 100, 0.0001, 0.9999);
      const mappedL = 100 / (1 + Math.exp(-(logit(unitL) + shift)));
      const highlight = smoothstep(highlightStart, 98, originalL);
      // Keep dark strands dark and avoid tinting nearly white specular reflections.
      const toneWeight = (live ? smoothstep(2, 32, originalL) : 0.2 + 0.8 * smoothstep(3, 25, originalL)) * (1 - 0.9 * highlight);
      const chromaMix = live ? .75 : .9, detail = live ? .75 : .45;
      const rgb = gamutMapLabToRgb({
        l: originalL + (mappedL - originalL) * (1 - 0.65 * highlight),
        a: originalA * (1 - toneWeight) + (target.a * chromaScale * chromaMix + (originalA - mean.a) * detail) * toneWeight,
        b: originalB * (1 - toneWeight) + (target.b * chromaScale * chromaMix + (originalB - mean.b) * detail) * toneWeight,
      });
      output.data[p] = source.data[p] + (rgb.r - source.data[p]) * alpha;
      output.data[p + 1] = source.data[p + 1] + (rgb.g - source.data[p + 1]) * alpha;
      output.data[p + 2] = source.data[p + 2] + (rgb.b - source.data[p + 2]) * alpha;
    }
    if (yieldToBrowser) await pause();
  }
  checkAbort(signal);
  return output;
};
