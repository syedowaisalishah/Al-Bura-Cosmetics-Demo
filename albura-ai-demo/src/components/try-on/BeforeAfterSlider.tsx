export function BeforeAfterSlider() {
  return (
    <div className="comparison-placeholder">
      <div className="comparison-labels"><span>Original</span><span>Colour preview</span></div>
      <label className="sr-only" htmlFor="comparison">Before and after comparison (unavailable)</label>
      <input id="comparison" type="range" min={0} max={100} defaultValue={50} disabled />
      <p className="small-note">Your before-and-after comparison will appear here.</p>
    </div>
  );
}
