import type { GuideClassification, GuideInput, GuideResult } from "@/types/guide";
import { DENSITY_OPTIONS, GREY_OPTIONS, HAIR_HISTORY_OPTIONS, LENGTH_OPTIONS, SAFETY_REMINDERS } from "@/lib/guide/guide-reference";

export const GUIDE_RULES_STATUS = "demo_unapproved" as const;
export type GenerateTechnicalGuide = (input: GuideInput) => GuideResult;
function validateLevel(level: number) {
  if (!Number.isInteger(level) || level < 1 || level > 10) throw new Error("Hair levels must be whole numbers from 1 to 10.");
}

/** Deterministic demo categories from the supplied brief; no chemical formulation. */
export const generateTechnicalGuide: GenerateTechnicalGuide = (input) => {
  const { naturalLevel, selectedShade, hairHistory, greyPercentage, hairLength, hairDensity } = input;
  validateLevel(naturalLevel); validateLevel(selectedShade.level);
  if (!HAIR_HISTORY_OPTIONS.some((option) => option.value === hairHistory)
    || !GREY_OPTIONS.some((option) => option.value === greyPercentage)
    || !LENGTH_OPTIONS.some((option) => option.value === hairLength)
    || !DENSITY_OPTIONS.some((option) => option.value === hairDensity)) throw new Error("Choose valid manual guide inputs.");
  const liftDifference = selectedShade.level - naturalLevel;
  let classification: GuideClassification;
  // Specific history restriction and largest thresholds must take precedence.
  if (hairHistory === "previously-bleached" && liftDifference > 0) classification = "Professional consultation required";
  else if (liftDifference > 6) classification = "Multi-session professional assessment";
  else if (liftDifference > 4) classification = "Pre-lightening assessment required";
  else if (liftDifference > 2) classification = "Significant lift assessment; professional review";
  else if (liftDifference > 0) classification = "Moderate lift assessment";
  else classification = "Deposit/darken assessment";

  const warnings: string[] = [...SAFETY_REMINDERS];
  if (hairHistory === "previously-coloured") warnings.push("Previously coloured hair needs professional review; this level comparison does not predict how existing colour will respond.");
  if (hairHistory === "previously-bleached") warnings.push("Previously bleached hair is flagged for professional review, including when the target is the same level or darker.");
  if (greyPercentage !== "none") warnings.push("Grey percentage is a manual summary input. No grey-coverage formula is approved or calculated.");
  if (liftDifference > 2) warnings.push("This level gap is a demonstration classification requiring professional assessment, not permission to perform lightening.");
  return {
    classification, naturalLevel, targetLevel: selectedShade.level, liftDifference,
    selectedShade, reflection: selectedShade.reflection, warnings, approvalStatus: GUIDE_RULES_STATUS,
  };
};
