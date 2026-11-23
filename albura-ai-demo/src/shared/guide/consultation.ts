import type { GuideInput, GuideResult } from "@/shared/types/guide";
import { DENSITY_OPTIONS, GREY_OPTIONS, HAIR_HISTORY_OPTIONS, LENGTH_OPTIONS } from "@/shared/guide/guide-reference";

export function consultationNotes(input: GuideInput, result: GuideResult) {
  const history = HAIR_HISTORY_OPTIONS.find((x) => x.value === input.hairHistory)!.label;
  const grey = GREY_OPTIONS.find((x) => x.value === input.greyPercentage)!.label;
  const length = LENGTH_OPTIONS.find((x) => x.value === input.hairLength)!.label;
  const density = DENSITY_OPTIONS.find((x) => x.value === input.hairDensity)!.label;
  const reason = input.hairHistory === "previously-bleached" && result.liftDifference > 0
    ? "Previously bleached hair and a lighter target need an individual professional assessment."
    : result.liftDifference <= 0 ? "Your selected shade is the same depth or darker than the starting level. Review depositing colour with your stylist."
    : result.liftDifference > 4 ? "This is a substantial change in depth. A professional should assess pre-lightening and whether multiple visits are appropriate."
    : "The target is lighter than your starting level. A professional should assess existing pigment, condition and achievable lift.";
  return { reason, profile: `${history} · Grey: ${grey} · ${length} · ${density}`,
    historyNote: input.hairHistory === "virgin" ? "Untreated hair selected. Confirm the starting depth before planning a colour service." : input.hairHistory === "previously-coloured" ? "Existing artificial colour can respond differently from untreated hair. Discuss previous products and dates with your stylist." : "Previously lightened hair needs a condition and strand assessment before another service.",
    coverageNote: input.greyPercentage === "none" ? "No grey coverage requested." : `${grey} grey selected. Coverage needs a product-specific professional assessment.`,
    serviceNote: `${length}, ${density.toLowerCase()} hair: allow for sectioning and a personalised product assessment. Quantities are not estimated in this prototype.` };
}
