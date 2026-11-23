"use client";

import { useRef, useState, type PointerEvent } from "react";

interface BeforeAfterSliderProps { originalUrl: string; resultUrl: string | null; width: number; height: number; debugUrl?: string | null }
export function BeforeAfterSlider({ originalUrl, resultUrl, width, height, debugUrl }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!resultUrl || debugUrl) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)));
  }
  return (
    <div className="comparison-active">
      <div className="comparison-image" style={{ aspectRatio: `${width}/${height}`, touchAction: resultUrl && !debugUrl ? "none" : "pan-y" }}
        onPointerDown={(event) => { if (!resultUrl || debugUrl) return; dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); move(event); }}
        onPointerMove={(event) => { if (dragging.current) move(event); }} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
        {/* Local object URLs are deliberately rendered directly; Next's optimizer is not involved. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={debugUrl || originalUrl} alt={debugUrl ? "AI hair mask shown in green over the original photo" : "Your original portrait"} width={width} height={height} draggable={false} />
        {resultUrl && !debugUrl && <>
          <div className="comparison-after" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="AI hair colour preview" width={width} height={height} draggable={false} />
          </div>
          <div className="comparison-divider" style={{ left: `${position}%` }} aria-hidden="true"><span>↔</span></div>
          <div className="image-labels"><span>Original</span><span>After</span></div>
        </>}
        {debugUrl && <span className="mask-label">AI hair mask · green</span>}
      </div>
      {resultUrl && !debugUrl && <div className="comparison-controls">
        <label htmlFor="comparison">Compare original and preview</label>
        <input id="comparison" type="range" min={0} max={100} value={position} onChange={(event) => setPosition(Number(event.target.value))} aria-valuetext={`${Math.round(position)}% original, ${Math.round(100 - position)}% preview`} />
        <div className="comparison-views" role="group" aria-label="View original or colour preview"><button type="button" aria-pressed={position === 100} onClick={() => setPosition(100)}>Original</button><button type="button" aria-pressed={position === 50} onClick={() => setPosition(50)}>Compare</button><button type="button" aria-pressed={position === 0} onClick={() => setPosition(0)}>Colour preview</button></div>
        <p className="small-note">Drag across the photo, or use the slider and arrow keys.</p>
      </div>}
    </div>
  );
}
