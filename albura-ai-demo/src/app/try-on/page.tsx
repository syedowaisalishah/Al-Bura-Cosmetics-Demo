import type { Metadata } from "next";
import { TryOnProvider } from "@/components/try-on/TryOnProvider";
import { TryOnStudio } from "@/components/try-on/TryOnStudio";
import { demoShades } from "@/data/shades";

export const metadata: Metadata = { title: "Try-On Studio" };

export default function TryOnPage() {
  return (
    <main id="main-content" className="container studio-page">
      <div className="studio-page-heading"><div><p className="eyebrow">YOUR NEXT COLOUR STARTS HERE</p><h1>The colour studio</h1><p>Upload a portrait or open your camera. Explore your next shade.</p></div><span className="quiet-tag">Photo & camera capture</span></div>
      <div className="phase-notice" role="note"><strong>Your photos and video stay with you.</strong> AI previews run on your device. The synchronized technical guide is an unapproved educational demonstration.</div>
      <TryOnProvider shades={demoShades}><TryOnStudio /></TryOnProvider>
    </main>
  );
}
