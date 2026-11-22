"use client";

import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { filterShades } from "@/lib/color/shade-filter";
import type { Shade, ShadeFamily } from "@/types/shade";
interface ShadePaletteProps { shades: readonly Shade[]; selectedShadeId: string; onSelect: (id: string) => void }
const families: { value: ShadeFamily | "all"; label: string }[] = [
  { value: "all", label: "All shades" }, { value: "natural", label: "Natural" }, { value: "ash", label: "Ash" },
  { value: "gold", label: "Gold" }, { value: "copper", label: "Copper" }, { value: "red", label: "Red" }, { value: "violet", label: "Violet" },
];
export function ShadePalette({ shades, selectedShadeId, onSelect }: ShadePaletteProps) {
  const [query, setQuery] = useState(""), [family, setFamily] = useState<ShadeFamily | "all">("all");
  const visible = filterShades(shades, query, family), selected = shades.find((shade) => shade.id === selectedShadeId);
  const filtered = query !== "" || family !== "all";
  function clear() { setQuery(""); setFamily("all"); }
  return (
    <section className="palette-section" aria-labelledby="palette-title">
      <div className="section-heading"><div><p className="eyebrow">A WORLD OF POSSIBILITIES</p><h2 id="palette-title" tabIndex={-1}>The demo shade edit</h2></div><span className="quiet-tag">12 illustrative shades</span></div>
      <p className="section-description">Choose a shade for your photo. Sample colours are illustrative and pending official Al Bura shade-card approval.</p>
      <div className="palette-tools">
        <div className="shade-search"><label htmlFor="shade-search">Find a shade</label><div><Search size={18} aria-hidden="true" /><input id="shade-search" type="search" placeholder="Name, code or colour…" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
        <div className="family-filters" role="group" aria-label="Filter shades by colour family">{families.map((item) => <button key={item.value} type="button" aria-pressed={family === item.value} onClick={() => setFamily(item.value)}>{item.label}</button>)}</div>
      </div>
      <div className="palette-summary"><p role="status" aria-live="polite">{visible.length} of {shades.length} shades{selected ? ` · Selected: ${selected.name}` : ""}</p>{filtered && <button type="button" onClick={clear}><X size={14} aria-hidden="true" /> Clear filters</button>}</div>
      <div className="shade-grid" role="group" aria-label="Select one illustrative hair shade">
        {visible.map((shade) => (
          <button key={shade.id} type="button" className={`shade-tile ${shade.id === selectedShadeId ? "is-selected" : ""}`} aria-pressed={shade.id === selectedShadeId}
            aria-label={`${shade.name}, ${shade.code}, ${shade.hex}`} onClick={() => onSelect(shade.id)}>
            <span className="shade-swatch" style={{ backgroundColor: shade.hex }} aria-hidden="true">{shade.id === selectedShadeId && <span className="shade-selected-mark"><Check size={15} /></span>}</span>
            <span className="shade-code">{shade.code}</span><span className="shade-name">{shade.name}</span>
            <span className="shade-detail">Level {shade.level} · {shade.reflection}</span><span className="shade-hex">{shade.hex} · <span className="family-name">{shade.family}</span></span>
          </button>
        ))}
      </div>
      {visible.length === 0 && <div className="shade-empty"><p>No sample shades match these filters.</p><button type="button" className="button button-secondary" onClick={clear}>Show all shades</button></div>}
    </section>
  );
}
