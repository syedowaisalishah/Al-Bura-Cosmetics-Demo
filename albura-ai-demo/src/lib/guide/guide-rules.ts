import type { GuideInput, GuideResult } from "@/types/guide";

/** Brand-approved rules and source material are not yet available. */
export const GUIDE_RULES_STATUS = "awaiting-brand-approval" as const;
export type GenerateTechnicalGuide = (input: GuideInput) => GuideResult;
