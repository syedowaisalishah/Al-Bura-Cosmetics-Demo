import type { Metadata } from "next";
import { HairTryOn } from "@/components/try-on/HairTryOn";
import { ShadePalette } from "@/components/try-on/ShadePalette";
import { TechnicalGuide } from "@/components/guide/TechnicalGuide";
import { demoShades } from "@/data/shades";

export const metadata: Metadata = { title: "Try-On Studio" };

export default function TryOnPage() {
  return (
    <main id="main-content" className="container studio-page">
      <div className="studio-page-heading"><div><p className="eyebrow">YOUR NEXT COLOUR STARTS HERE</p><h1>The colour studio</h1><p>Imagine the change. Explore the possibilities.</p></div><span className="quiet-tag">Phase 1 · Preview shell</span></div>
      <div className="phase-notice" role="note"><strong>A first look at the studio.</strong> Photo upload, AI previews, shade selection, and technical guidance are coming in the next phases.</div>
      <div className="studio-windows"><HairTryOn /><TechnicalGuide /></div>
      <ShadePalette shades={demoShades} />
    </main>
  );
}
