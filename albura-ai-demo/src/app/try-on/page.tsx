import type { Metadata } from "next";
import { TryOnProvider } from "@/components/try-on/TryOnProvider";
import { TryOnStudio } from "@/components/try-on/TryOnStudio";
import { demoShades } from "@/data/shades";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Try-On Studio" };

export default function TryOnPage() {
  return (
    <main id="main-content" className="container studio-page">
      <div className="studio-page-heading"><div><p className="eyebrow">A LITTLE CURIOSITY STARTS HERE</p><h1>Your colour, <em>reimagined.</em></h1><p>Meet a new shade. Keep everything that makes you, you.</p></div><div className="studio-privacy"><ShieldCheck size={21} strokeWidth={1.4} aria-hidden="true" /><div><strong>A space just for you</strong><span>Photos & video stay on your device</span></div></div></div>
      <TryOnProvider shades={demoShades}><TryOnStudio /></TryOnProvider>
    </main>
  );
}
