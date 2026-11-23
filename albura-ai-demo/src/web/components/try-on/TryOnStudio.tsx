"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { HairTryOn } from "@/web/components/try-on/HairTryOn";
import { TechnicalGuide } from "@/web/components/guide/TechnicalGuide";
import { ShadePalette } from "@/web/components/try-on/ShadePalette";
import { useTryOn } from "@/web/components/try-on/TryOnProvider";

type StudioTab = "try-on" | "guide";
const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
const desktopOnServer = () => false;
const subscribeViewport = (notify: () => void) => {
  const query = window.matchMedia("(max-width: 760px)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
export function TryOnStudio() {
  const { shades, selectedShade, selectShade } = useTryOn();
  const [tab, setTab] = useState<StudioTab>("try-on");
  const mobile = useSyncExternalStore(subscribeViewport, isMobile, desktopOnServer);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const shade = new URLSearchParams(window.location.search).get("shade");
    if (shade) selectShade(shade);
  }, [selectShade]);
  useEffect(() => {
    const selectFromHash = () => { if (window.location.hash === "#technical-guide") { setTab("guide"); requestAnimationFrame(() => document.getElementById("technical-guide")?.scrollIntoView({ block: "start" })); } };
    const timer = setTimeout(selectFromHash, 0);
    window.addEventListener("hashchange", selectFromHash);
    return () => { clearTimeout(timer); window.removeEventListener("hashchange", selectFromHash); };
  }, []);
  function tabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : event.key === "ArrowRight" || event.key === "ArrowLeft" ? 1 - index : null;
    if (next === null) return;
    event.preventDefault(); setTab(next === 0 ? "try-on" : "guide"); tabButtons.current[next]?.focus();
  }
  return <>
    <ol className="studio-instructions" aria-label="How to use the colour studio"><li><span>1</span><div><strong>Add your photo</strong><p>Upload a portrait or take a photo. Your image stays private.</p></div></li><li><span>2</span><div><strong>Explore a shade</strong><p>Wait for the preview, then choose from the palette below.</p></div></li><li><span>3</span><div><strong>Compare & save</strong><p>Save your preview and confirm your photo estimate in Window 2.</p></div></li></ol>
    <section className="shade-quickpick" aria-label="Quick shade selection"><div><strong>The colour edit</strong><span>Choose a shade. Make it yours.</span></div><div className="quick-shades">{shades.map((shade) => <button type="button" key={shade.id} aria-label={`Quick select ${shade.name}`} aria-pressed={selectedShade.id === shade.id} onClick={() => selectShade(shade.id)}><span style={{ backgroundColor: shade.hex }} aria-hidden="true" /><span>{shade.name}</span></button>)}</div><a href="#palette-title">Search all shades ↗</a></section>
    <div className="studio-tabs" role="tablist" aria-label="Studio windows">
      <button ref={(element) => { tabButtons.current[0] = element; }} id="try-on-tab" type="button" role="tab" aria-selected={tab === "try-on"}
        aria-controls="try-on-panel" tabIndex={tab === "try-on" ? 0 : -1} onClick={() => setTab("try-on")} onKeyDown={(event) => tabKeys(event, 0)}>Try-On</button>
      <button ref={(element) => { tabButtons.current[1] = element; }} id="guide-tab" type="button" role="tab" aria-selected={tab === "guide"}
        aria-controls="guide-panel" tabIndex={tab === "guide" ? 0 : -1} onClick={() => setTab("guide")} onKeyDown={(event) => tabKeys(event, 1)}>Colour consultation</button>
    </div>
    <div className="studio-windows">
      <div id="try-on-panel" className={`studio-panel${tab === "try-on" ? " is-active" : ""}`} role="tabpanel" aria-labelledby="try-on-tab"><HairTryOn active={!mobile || tab === "try-on"} /></div>
      <div id="guide-panel" className={`studio-panel${tab === "guide" ? " is-active" : ""}`} role="tabpanel" aria-labelledby="guide-tab"><TechnicalGuide /></div>
    </div>
    <ShadePalette shades={shades} selectedShadeId={selectedShade.id} onSelect={selectShade} />
  </>;
}
