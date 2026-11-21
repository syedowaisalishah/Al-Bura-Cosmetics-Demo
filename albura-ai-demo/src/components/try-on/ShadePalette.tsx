import type { Shade } from "@/types/shade";

export function ShadePalette({ shades }: { shades: readonly Shade[] }) {
  return (
    <section className="palette-section" aria-labelledby="palette-title">
      <div className="section-heading">
        <div><p className="eyebrow">A WORLD OF POSSIBILITIES</p><h2 id="palette-title">The demo shade edit</h2></div>
        <span className="quiet-tag">12 illustrative shades</span>
      </div>
      <p className="section-description">A sample palette for the studio. These colours and codes are illustrative and are not officially approved Al Bura shades. Shade selection is coming next.</p>
      <ul className="shade-grid">
        {shades.map((shade) => (
          <li key={shade.id} className="shade-tile">
            <span className="shade-swatch" style={{ backgroundColor: shade.hex }} aria-hidden="true" />
            <span className="shade-code">{shade.code}</span>
            <h3>{shade.name}</h3>
            <span className="shade-detail">Level {shade.level} · {shade.reflection}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
