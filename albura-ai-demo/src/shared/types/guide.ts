import type { Shade } from "@/shared/types/shade";

export type HairHistory = "virgin" | "previously-coloured" | "previously-bleached";
export type GreyPercentage = "none" | "below-50" | "above-50";
export type HairLength = "short" | "shoulder" | "long" | "extra-long";
export type HairDensity = "fine" | "medium" | "thick";

/** Starting level may be suggested from original hair pixels; user confirmation is required. History stays manual. */
export interface GuideInput {
  selectedShade: Shade;
  naturalLevel: number;
  hairHistory: HairHistory;
  greyPercentage: GreyPercentage;
  hairLength: HairLength;
  hairDensity: HairDensity;
}

/** User-provided details, shared by the consultation UI and backend. */
export type HairProfile = Omit<GuideInput, "selectedShade">;

/** Only metadata crosses HTTP. The server looks up the shade from its own catalogue. */
export interface GuideRequest extends HairProfile {
  shadeId: string;
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
