/** Phase 2 colour-space contracts. Conversions are deliberately not implemented. */
export interface RgbColor { r: number; g: number; b: number }
export interface LabColor { l: number; a: number; b: number }
export type HexToRgb = (hex: string) => RgbColor;
export type RgbToLab = (rgb: RgbColor) => LabColor;
