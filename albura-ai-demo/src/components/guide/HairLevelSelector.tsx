"use client";

import { useTryOn } from "@/components/try-on/TryOnProvider";
import { HAIR_LEVELS } from "@/lib/guide/guide-reference";

export function HairLevelSelector() {
  const { naturalLevel, setGuideInput, photoAnalysis, levelSource, levelConfirmed, usePhotoLevel, analysisPending } = useTryOn();
  const level = HAIR_LEVELS[naturalLevel - 1];
  return (
    <fieldset className="hair-level-section guide-section">
      <legend>Confirm your starting level</legend>
      <p className="small-note" id="hair-level-note">{photoAnalysis ? "Estimated from your original hair pixels using an illustrative level scale. Lighting and previous colour affect the estimate; confirm or adjust it." : "Choose the closest match to your current hair depth. A photo will suggest an approximate starting level."}</p>
      <div className="level-swatches" role="group" aria-label="Natural hair level swatches">
        {HAIR_LEVELS.map((item) => <button type="button" key={item.level} aria-pressed={naturalLevel === item.level}
          disabled={analysisPending} aria-label={`Level ${item.level}: ${item.name}`} onClick={() => setGuideInput("naturalLevel", item.level)}>
          <span style={{ backgroundColor: item.hex }} aria-hidden="true" /><span>{item.level}</span>
        </button>)}
      </div>
      <div className="level-selection"><label htmlFor="hair-level">Level {naturalLevel} <strong>{level.name}</strong></label><span>{levelConfirmed ? "Confirmed" : levelSource === "photo" ? "Photo estimate · needs confirmation" : "Manual starting point"}</span></div>
      <input id="hair-level" type="range" disabled={analysisPending} min={1} max={10} step={1} value={naturalLevel} aria-describedby="hair-level-note"
        aria-valuetext={`Level ${naturalLevel}, ${level.name}`} onChange={(event) => setGuideInput("naturalLevel", Number(event.target.value))} />
      {photoAnalysis && levelSource === "manual" && <button type="button" className="use-photo-level" onClick={usePhotoLevel}>Use photo estimate (level {photoAnalysis.estimatedLevel})</button>}
      <div className="range-extremes"><span>1 · darkest</span><span>10 · lightest</span></div>
    </fieldset>
  );
}
