"use client";

import { useTryOn } from "@/components/try-on/TryOnProvider";
import { HAIR_LEVELS } from "@/lib/guide/guide-reference";

export function HairLevelSelector() {
  const { naturalLevel, setGuideInput } = useTryOn();
  const level = HAIR_LEVELS[naturalLevel - 1];
  return (
    <fieldset className="hair-level-section guide-section">
      <legend>Your natural hair level</legend>
      <p className="small-note" id="hair-level-note">Manual selection · demo starts at level 4. No level is estimated from your photo.</p>
      <div className="level-swatches" role="group" aria-label="Natural hair level swatches">
        {HAIR_LEVELS.map((item) => <button type="button" key={item.level} aria-pressed={naturalLevel === item.level}
          aria-label={`Level ${item.level}: ${item.name}`} onClick={() => setGuideInput("naturalLevel", item.level)}>
          <span style={{ backgroundColor: item.hex }} aria-hidden="true" /><span>{item.level}</span>
        </button>)}
      </div>
      <div className="level-selection"><label htmlFor="hair-level">Level {naturalLevel} <strong>{level.name}</strong></label><span>Selected manually</span></div>
      <input id="hair-level" type="range" min={1} max={10} step={1} value={naturalLevel} aria-describedby="hair-level-note"
        aria-valuetext={`Level ${naturalLevel}, ${level.name}`} onChange={(event) => setGuideInput("naturalLevel", Number(event.target.value))} />
      <div className="range-extremes"><span>1 · darkest</span><span>10 · lightest</span></div>
    </fieldset>
  );
}
