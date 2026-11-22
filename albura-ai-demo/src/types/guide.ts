import type { Shade } from "@/types/shade";

export type HairHistory = "virgin" | "previously-coloured" | "previously-bleached";
export type GreyPercentage = "none" | "below-50" | "above-50";
export type HairLength = "short" | "shoulder" | "long" | "extra-long";
export type HairDensity = "fine" | "medium" | "thick";

/** Manual inputs only. Neither hair level nor history is inferred from a photo. */
export interface GuideInput {
  selectedShade: Shade;
  naturalLevel: number;
  hairHistory: HairHistory;
  greyPercentage: GreyPercentage;
  hairLength: HairLength;
  hairDensity: HairDensity;
}

export type GuideClassification =
  | "Professional consultation required"
  | "Deposit/darken assessment"
  | "Moderate lift assessment"
  | "Significant lift assessment; professional review"
  | "Pre-lightening assessment required"
  | "Multi-session professional assessment";

/** Educational workflow classification; never an approved chemical formulation. */
export interface GuideResult {
  classification: GuideClassification;
  naturalLevel: number;
  targetLevel: number;
  liftDifference: number;
  selectedShade: Shade;
  reflection: string;
  warnings: string[];
  approvalStatus: "demo_unapproved";
}
