import type { GreyPercentage, HairDensity, HairHistory, HairLength } from "@/types/guide";
import type { Shade } from "@/types/shade";

/** Approximate visual references supplied for this demonstration, not a brand card. */
export const HAIR_LEVELS = [
  { level: 1, name: "Darkest black", hex: "#171414", pigment: "Red", pigmentHex: "#8F2932" },
  { level: 2, name: "Very dark brown", hex: "#2D211C", pigment: "Red", pigmentHex: "#A02D34" },
  { level: 3, name: "Dark brown", hex: "#453027", pigment: "Red-brown", pigmentHex: "#884431" },
  { level: 4, name: "Medium brown", hex: "#624333", pigment: "Red-orange", pigmentHex: "#BE5836" },
  { level: 5, name: "Light brown", hex: "#805C42", pigment: "Orange", pigmentHex: "#D58235" },
  { level: 6, name: "Dark blonde", hex: "#9C7C54", pigment: "Orange-gold", pigmentHex: "#D59B39" },
  { level: 7, name: "Medium blonde", hex: "#B79664", pigment: "Gold", pigmentHex: "#DAB54C" },
  { level: 8, name: "Light blonde", hex: "#CCB080", pigment: "Yellow", pigmentHex: "#E4D361" },
  { level: 9, name: "Very light blonde", hex: "#DFCAA4", pigment: "Pale yellow", pigmentHex: "#EEE3A2" },
  { level: 10, name: "Lightest blonde", hex: "#EEE0C0", pigment: "Palest yellow", pigmentHex: "#F5EECF" },
] as const;

export const HAIR_HISTORY_OPTIONS: { value: HairHistory; label: string }[] = [
  { value: "virgin", label: "Virgin hair" },
  { value: "previously-coloured", label: "Previously coloured hair" },
  { value: "previously-bleached", label: "Previously bleached hair" },
];
export const GREY_OPTIONS: { value: GreyPercentage; label: string }[] = [
  { value: "none", label: "None" }, { value: "below-50", label: "Below 50%" }, { value: "above-50", label: "Above 50%" },
];
export const LENGTH_OPTIONS: { value: HairLength; label: string }[] = [
  { value: "short", label: "Short" }, { value: "shoulder", label: "Shoulder length" },
  { value: "long", label: "Long" }, { value: "extra-long", label: "Extra long" },
];
export const DENSITY_OPTIONS: { value: HairDensity; label: string }[] = [
  { value: "fine", label: "Fine" }, { value: "medium", label: "Medium" }, { value: "thick", label: "Thick" },
];
export const SAFETY_REMINDERS = [
  "Official product instructions are required.",
  "Remember patch and strand testing as directed by the official product instructions.",
  "Avoid use on a damaged or irritated scalp.",
  "Previously bleached hair requires additional professional assessment.",
  "No unapproved quantities or processing times are provided.",
  "Final outcomes depend on hair condition and history.",
] as const;
export const LOCKED_GUIDANCE = ["Developer selection", "Chemical quantities", "Mixing ratios", "Processing timers", "Bleach procedures"] as const;

export function formatLift(difference: number) { return difference > 0 ? `+${difference}` : `${difference}`; }
export function reflectionNotation(shade: Shade) {
  const notation = shade.code.match(/\.(\d+)$/)?.[1];
  return `${shade.reflection}${notation ? ` (.${notation})` : ""}`;
}
