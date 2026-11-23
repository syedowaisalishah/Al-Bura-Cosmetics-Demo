import type { HairColorCache } from "@/lib/ai/hair-recolor";
import { hexToRgb, rgbToLab } from "@/lib/color/color-utils";
import { HAIR_LEVELS } from "@/lib/guide/guide-reference";

export interface PhotoAnalysis {
  source: "upload" | "camera";
  width: number;
  height: number;
  estimatedLevel: number;
  medianLightness: number;
  lighting: "dim" | "bright" | "normal";
}

/** Approximate starting depth from ORIGINAL masked pixels, never the recoloured preview.
 * The reference swatches are illustrative, not a brand-calibrated measurement.
 */
export function analysePhoto(cache: HairColorCache, source: PhotoAnalysis["source"]): PhotoAnalysis {
  const histogram = new Float64Array(101);
  let total = 0;
  for (let j = 0; j < cache.indices.length; j++) {
    const weight = cache.mask.alpha[cache.indices[j]];
    if (weight < .8) continue;
    histogram[Math.max(0, Math.min(100, Math.round(cache.lab[j * 3])))] += weight;
    total += weight;
  }
  if (total < 20) {
    histogram.fill(0); total = 0;
    for (let j = 0; j < cache.indices.length; j++) {
      const weight = cache.mask.alpha[cache.indices[j]];
      histogram[Math.max(0, Math.min(100, Math.round(cache.lab[j * 3])))] += weight; total += weight;
    }
  }
  if (total < 20) throw new Error("Not enough clear hair to estimate a starting level.");
  let cumulative = 0, median = 0;
  for (; median < 100; median++) { cumulative += histogram[median]; if (cumulative >= total / 2) break; }
  const reference = HAIR_LEVELS.map((level) => ({ level: level.level, distance: Math.abs(rgbToLab(hexToRgb(level.hex)).l - median) }));
  reference.sort((a, b) => a.distance - b.distance);
  let brightness = 0, count = 0;
  for (let i = 0; i < cache.source.data.length; i += 16) {
    if (cache.source.data[i + 3] < 128) continue;
    brightness += cache.source.data[i] * .2126 + cache.source.data[i + 1] * .7152 + cache.source.data[i + 2] * .0722; count++;
  }
  const average = brightness / Math.max(1, count);
  return { source, width: cache.source.width, height: cache.source.height, estimatedLevel: reference[0].level, medianLightness: median,
    lighting: average < 55 ? "dim" : average > 220 ? "bright" : "normal" };
}
