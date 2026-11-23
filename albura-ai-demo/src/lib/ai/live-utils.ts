import type { RefinedHairMask } from "@/lib/ai/mask-utils";
import type { HairColorCache } from "@/lib/ai/hair-recolor";

export const LIVE_INTERVAL_MS = 125; // Maximum 8 analyses/s; actual throughput is measured.
export function liveDimensions(width: number, height: number, limit = 320) {
  if (![width, height, limit].every((v) => Number.isFinite(v) && v > 0)) throw new Error("The camera returned invalid dimensions.");
  const scale = Math.min(1, limit / width, limit * .75 / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
export class LiveQuality {
  limit = 320;
  private slow = 0;
  // Caller supplies pixel/transfer duration, excluding fixed-size model inference.
  record(ms: number) {
    this.slow = ms > 180 ? this.slow + 1 : 0;
    if (this.slow >= 3) { this.limit = this.limit === 320 ? 256 : 192; this.slow = 0; }
  }
}

/** Current support is authoritative: smoothing can never retain hair on newly excluded pixels. */
export class LiveMaskSmoother {
  private previous: RefinedHairMask | null = null;
  private pixels: Uint8ClampedArray | null = null;
  private timestamp = -1;
  reset() { this.previous = null; this.pixels = null; this.timestamp = -1; }
  update(mask: RefinedHairMask, pixels: Uint8ClampedArray, timestampMs: number) {
    const area = mask.width * mask.height;
    if (pixels.length !== area * 4) throw new Error("Live pixels and mask dimensions do not match.");
    if (mask.hairPixels < Math.max(32, area * .001) || mask.hairPixels > area * .95) {
      this.reset(); return { ...mask, alpha: new Float32Array(area), hairPixels: 0 };
    }
    const prior = this.previous;
    let compatible = !!prior && prior.width === mask.width && prior.height === mask.height && timestampMs > this.timestamp && timestampMs - this.timestamp < 1200;
    if (compatible && this.pixels) {
      let motion = 0, samples = 0;
      for (let i = 1; i < pixels.length; i += 64) { motion += Math.abs(pixels[i] - this.pixels[i]); samples++; }
      if (motion / Math.max(1, samples) > 18) compatible = false;
    }
    const alpha = new Float32Array(mask.alpha);
    let hairPixels = 0;
    for (let i = 0; i < area; i++) {
      if (compatible && prior && alpha[i] > 0) alpha[i] = Math.min(alpha[i], .75 * alpha[i] + .25 * prior.alpha[i]);
      if (alpha[i] > .1) hairPixels++;
    }
    if (!this.pixels || this.pixels.length !== pixels.length) this.pixels = new Uint8ClampedArray(pixels.length);
    this.pixels.set(pixels); this.timestamp = timestampMs;
    this.previous = { ...mask, alpha, hairPixels };
    return this.previous;
  }
}

/** Stabilize only global colour statistics, never blur the source pixels/strand detail. */
export class LiveColorSmoother {
  private previous: { mean: HairColorCache["mean"]; toneAnchor: number } | null = null;
  reset() { this.previous = null; }
  update(cache: HairColorCache) {
    const prior = this.previous;
    if (prior && Math.abs(prior.mean.l - cache.mean.l) < 12) {
      cache.mean = { l: cache.mean.l * .8 + prior.mean.l * .2, a: cache.mean.a * .8 + prior.mean.a * .2, b: cache.mean.b * .8 + prior.mean.b * .2 };
      cache.toneAnchor = cache.toneAnchor * .8 + prior.toneAnchor * .2;
    }
    this.previous = { mean: { ...cache.mean }, toneAnchor: cache.toneAnchor };
  }
}
