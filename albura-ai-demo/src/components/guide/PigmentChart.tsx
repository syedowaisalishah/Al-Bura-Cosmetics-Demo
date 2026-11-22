"use client";

import { useTryOn } from "@/components/try-on/TryOnProvider";
import { HAIR_LEVELS, reflectionNotation } from "@/lib/guide/guide-reference";

export function PigmentChart() {
  const { naturalLevel, targetLevel, selectedShade } = useTryOn();
  return <section className="guide-section pigment-section" aria-labelledby="pigment-title">
    <h3 id="pigment-title">Pigment & reflection reference</h3>
    <p className="small-note">Illustrative educational reference, not a personalized chemical formula.</p>
    <div className="pigment-selection"><div><span>Target reflection</span><strong>{reflectionNotation(selectedShade)}</strong></div><div><span>Reference at target level {targetLevel}</span><strong>{HAIR_LEVELS[targetLevel - 1].pigment}</strong></div></div>
    <ol className="pigment-chart" aria-label="Underlying pigment reference by level">
      {HAIR_LEVELS.map((item) => <li key={item.level} className={targetLevel === item.level ? "is-target" : ""}>
        <span className="pigment-dot" style={{ backgroundColor: item.pigmentHex }} aria-hidden="true" />
        <span className="pigment-level">{item.level}</span><span>{item.pigment}</span>
        <span className="pigment-marker">{targetLevel === item.level && "Target"}{naturalLevel === item.level && `${targetLevel === item.level ? " · " : ""}Start`}</span>
      </li>)}
    </ol>
    <ul className="counteraction-reference" aria-label="Educational colour relationships">
      <li><span style={{ backgroundColor: "#3C5794" }} aria-hidden="true" />Blue counteracts orange.</li>
      <li><span style={{ backgroundColor: "#80618E" }} aria-hidden="true" />Violet counteracts yellow.</li>
      <li><span style={{ backgroundColor: "#4D7762" }} aria-hidden="true" />Green counteracts red.</li>
    </ul>
    <p className="small-note">Reference relationships only. They do not specify a product, quantity, technique or treatment outcome.</p>
  </section>;
}
