import type { Metadata } from "next";
import { TryOnProvider } from "@/components/try-on/TryOnProvider";
import { TryOnStudio } from "@/components/try-on/TryOnStudio";
import { demoShades } from "@/data/shades";

export const metadata: Metadata = { title: "Try-On Studio" };

export default function TryOnPage() {
  return (
    <main id="main-content" className="container studio-page">
      <div className="studio-page-heading"><div><p className="eyebrow">YOUR NEXT COLOUR STARTS HERE</p><h1>The colour studio</h1><p>Try a shade. See the change. Plan your next conversation.</p></div><span className="quiet-tag">Your personal colour studio</span></div>
      <div className="phase-notice" role="note"><strong>Your photos and video stay with you.</strong> AI previews run on your device. Your photo preview and colour consultation work together. No photo is sent to our server.</div>
      <TryOnProvider shades={demoShades}><TryOnStudio /></TryOnProvider>
    </main>
  );
}
