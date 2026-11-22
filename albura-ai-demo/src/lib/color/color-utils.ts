/** CIELAB (D65), sRGB companding and XYZ matrices. RGB uses the 0–255 range. */
export interface RgbColor { r: number; g: number; b: number }
export interface LabColor { l: number; a: number; b: number }
export type HexToRgb = (hex: string) => RgbColor;
export type RgbToLab = (rgb: RgbColor) => LabColor;
export const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

export const hexToRgb: HexToRgb = (hex) => {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error("Shade colour must be a six-digit HEX value.");
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
};
const linear = (channel: number) => { const c = channel / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const compand = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);
const forward = (v: number) => v > 216 / 24389 ? Math.cbrt(v) : (24389 / 27 * v + 16) / 116;
const inverse = (v: number) => v ** 3 > 216 / 24389 ? v ** 3 : (116 * v - 16) / (24389 / 27);

export const rgbToLab: RgbToLab = ({ r, g, b }) => {
  const R = linear(r), G = linear(g), B = linear(b);
  const x = forward((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047);
  const y = forward(0.2126729 * R + 0.7151522 * G + 0.072175 * B);
  const z = forward((0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883);
  return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
};

function labToLinearRgb({ l, a, b }: LabColor): RgbColor {
  const fy = (l + 16) / 116;
  const x = 0.95047 * inverse(fy + a / 500), y = inverse(fy), z = 1.08883 * inverse(fy - b / 200);
  return {
    r: 3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    g: -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    b: 0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  };
}
const toSrgb = ({ r, g, b }: RgbColor): RgbColor => ({ r: clamp(compand(r), 0, 255), g: clamp(compand(g), 0, 255), b: clamp(compand(b), 0, 255) });
export function labToRgb(lab: LabColor): RgbColor { return toSrgb(labToLinearRgb(lab)); }

/** Fit sRGB by reducing chroma, preserving Lab lightness/hue instead of clipping channels. */
export function gamutMapLabToRgb(lab: LabColor): RgbColor {
  const bounded = { ...lab, l: clamp(lab.l, 0, 100) };
  const inGamut = (rgb: RgbColor) => rgb.r >= -1e-7 && rgb.r <= 1.0000001 && rgb.g >= -1e-7 && rgb.g <= 1.0000001 && rgb.b >= -1e-7 && rgb.b <= 1.0000001;
  const direct = labToLinearRgb(bounded);
  if (inGamut(direct)) return toSrgb(direct);
  let low = 0, high = 1, result = labToLinearRgb({ ...bounded, a: 0, b: 0 });
  for (let step = 0; step < 8; step++) {
    const scale = (low + high) / 2;
    const rgb = labToLinearRgb({ ...bounded, a: bounded.a * scale, b: bounded.b * scale });
    if (inGamut(rgb)) { low = scale; result = rgb; } else high = scale;
  }
  return toSrgb(result);
}
