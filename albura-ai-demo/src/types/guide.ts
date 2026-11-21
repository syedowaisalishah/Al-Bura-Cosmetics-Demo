import type { Shade } from "@/types/shade";

/** Values are user supplied. Segmentation must never infer hair history. */
export interface GuideInput {
  currentLevel: number;
  targetShade: Shade;
  hairHistory: "natural" | "previously-coloured" | "unknown";
  greyCoverage: "none" | "some" | "mostly" | "unknown";
}

/** No formula or developer strength is approved or calculated in Phase 1. */
export interface GuideResult {
  status: "unavailable" | "review-required" | "ready";
  summary: string;
  considerations: string[];
  warnings: string[];
  rulesVersion: string | null;
}
