"use client";

import { ChevronDown } from "lucide-react";
import { useTryOn } from "@/components/try-on/TryOnProvider";
import { DENSITY_OPTIONS, GREY_OPTIONS, HAIR_HISTORY_OPTIONS, LENGTH_OPTIONS } from "@/lib/guide/guide-reference";
import type { GreyPercentage, HairDensity, HairHistory, HairLength } from "@/types/guide";

function SelectField<T extends string>({ id, label, value, options, onChange }: {
  id: string; label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <div className="field"><label htmlFor={id}>{label}</label><div className="select-wrap">
    <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    <ChevronDown size={16} aria-hidden="true" />
  </div></div>;
}
export function GuideInputs() {
  const { hairHistory, greyPercentage, hairLength, hairDensity, setGuideInput } = useTryOn();
  return <section className="guide-section guide-profile-inputs" aria-labelledby="history-title">
    <h3 id="history-title">Personalise your consultation</h3>
    <p className="small-note">These details update the consultation notes below.</p>
    <div className="guide-input-controls">
      <SelectField<HairHistory> id="hair-history" label="Hair history" value={hairHistory} options={HAIR_HISTORY_OPTIONS} onChange={(value) => setGuideInput("hairHistory", value)} />
      <SelectField<GreyPercentage> id="grey-percentage" label="Grey percentage" value={greyPercentage} options={GREY_OPTIONS} onChange={(value) => setGuideInput("greyPercentage", value)} />
      <SelectField<HairLength> id="hair-length" label="Hair length" value={hairLength} options={LENGTH_OPTIONS} onChange={(value) => setGuideInput("hairLength", value)} />
      <SelectField<HairDensity> id="hair-density" label="Hair density" value={hairDensity} options={DENSITY_OPTIONS} onChange={(value) => setGuideInput("hairDensity", value)} />
    </div>
  </section>;
}
