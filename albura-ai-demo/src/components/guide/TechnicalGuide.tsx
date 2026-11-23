"use client";

import { BookOpen, Check, Download, FileCheck2, ImageIcon, Printer, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HairLevelSelector } from "@/components/guide/HairLevelSelector";
import { GuideInputs } from "@/components/guide/GuideInputs";
import { PigmentChart } from "@/components/guide/PigmentChart";
import { useTryOn } from "@/components/try-on/TryOnProvider";
import { formatLift, reflectionNotation, HAIR_LEVELS } from "@/lib/guide/guide-reference";
import { consultationNotes } from "@/lib/guide/consultation";

export function TechnicalGuide() {
  const state = useTryOn();
  const { selectedShade: shade, naturalLevel, targetLevel, liftDifference, guideResult, photoAnalysis, analysisPending, levelConfirmed, confirmLevel, serverStatus } = state;
  const notes = consultationNotes(state, guideResult);
  function downloadSummary() {
    const blob = new Blob([JSON.stringify({ title: "Al Bura consultation summary", status: "prototype_unapproved", dataVersion: state.dataVersion, assessmentSource: state.serverStatus === "ready" ? "server-checked" : "local-preview",
      shade: { code: shade.code, name: shade.name, level: shade.level, reflection: shade.reflection },
      startingLevel: naturalLevel, startingLevelSource: state.levelSource, levelConfirmed,
      photoEstimate: photoAnalysis, hairProfile: { history: state.hairHistory, grey: state.greyPercentage, length: state.hairLength, density: state.hairDensity },
      assessment: guideResult.classification, levelDifference: liftDifference, notes,
      notice: "A discussion summary, not chemical application instructions. Follow approved product instructions and professional advice." }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `albura-consultation-${shade.code}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Card className="guide-card consultation-card" id="technical-guide" aria-labelledby="guide-title">
    <div className="card-heading"><div><p className="eyebrow">02 / YOUR COLOUR PLAN</p><h2 id="guide-title">Colour consultation</h2></div><BookOpen size={25} strokeWidth={1.25} aria-hidden="true" /></div>
    <p className="consultation-intro">Your photo suggests a starting level. Confirm it, then explore what your chosen shade means for your colour journey.</p>
    <div className={`photo-handoff ${photoAnalysis ? "has-analysis" : ""}`} role="status" aria-live="polite">
      <ImageIcon size={21} aria-hidden="true" /><div><strong>{analysisPending ? "Analysing your original hair…" : photoAnalysis ? `${photoAnalysis.source === "camera" ? "Camera photo" : "Uploaded photo"} connected` : "Start with your photo"}</strong>
      <p>{analysisPending ? "Your starting-level estimate will appear here." : photoAnalysis ? `${photoAnalysis.width} × ${photoAnalysis.height} · Photo estimate: level ${photoAnalysis.estimatedLevel}${photoAnalysis.lighting !== "normal" ? ` · ${photoAnalysis.lighting === "dim" ? "Low" : "Very bright"} lighting — check the estimate carefully` : ""}` : "Upload or capture a photo in Window 1, or select your starting level below."}</p></div>
    </div>
    <div className="consultation-target"><span style={{ backgroundColor: shade.hex }} aria-hidden="true" /><div><span className="eyebrow">YOUR SELECTED SHADE</span><h3>{shade.name}</h3><p>{shade.code} · {reflectionNotation(shade)}</p></div><span className="consultation-sample">Demo shade</span></div>
    <div className="consultation-depth" aria-label="Starting and target hair depths"><div><span>Starting level</span><strong>{naturalLevel}</strong><small>{levelConfirmed ? "Confirmed by you" : "Confirm below"}</small></div><div><span>Target level</span><strong>{targetLevel}</strong><small>{shade.name}</small></div><div><span>Level difference</span><strong>{formatLift(liftDifference)}</strong><small>{liftDifference > 0 ? "Lighter target" : liftDifference < 0 ? "Darker target" : "Same depth"}</small></div></div>
    <HairLevelSelector />
    {!levelConfirmed && <Button className="confirm-level" onClick={confirmLevel} disabled={analysisPending}><Check size={17} aria-hidden="true" /> Confirm starting level {naturalLevel}</Button>}
    <section className="consultation-assessment" aria-labelledby="assessment-title" aria-live="polite" aria-atomic="true">
      <div className="assessment-status"><FileCheck2 size={18} aria-hidden="true" /><span>{levelConfirmed ? "Your consultation overview" : "Preview · confirm your starting level"}</span></div>
      <h3 id="assessment-title">{guideResult.classification}</h3><p>{notes.reason}</p>
    </section>
    <GuideInputs />
    <div className="consultation-notes" aria-live="polite"><h3>What to discuss with your stylist</h3><ul><li>{notes.historyNote}</li><li>{notes.coverageNote}</li><li>{notes.serviceNote}</li></ul></div>
    <details className="consultation-reference"><summary>Colour theory & technical approval</summary><PigmentChart /><div className="consultation-safety"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Professional review comes first</strong><p>Follow the product leaflet, patch and strand testing guidance, and your stylist’s advice. Approved Al Bura shade data and formulation rules are required before developer strengths, quantities or processing timers can be offered.</p></div></div></details>
    <div className="consultation-approval"><ShieldCheck size={17} aria-hidden="true" /><p>Interview prototype · illustrative shades and an approximate photo estimate. This consultation is a discussion aid; chemical formulas require Al Bura technical approval.</p></div>
    <div className="consultation-actions"><Button variant="secondary" onClick={() => window.print()} disabled={!levelConfirmed}><Printer size={16} aria-hidden="true" /> Print / Save PDF</Button><Button variant="secondary" onClick={downloadSummary} disabled={!levelConfirmed}><Download size={16} aria-hidden="true" /> Save summary</Button></div>
    <p className="consultation-service" role="status">{serverStatus === "ready" ? "Consultation checked by the guide service" : serverStatus === "checking" ? "Updating your consultation…" : "Local consultation preview · guide service unavailable"}</p>
    <p className="print-only print-disclaimer">Starting hair: level {naturalLevel}, {HAIR_LEVELS[naturalLevel - 1].name}. {notes.profile}. Al Bura Cosmetics · Prototype consultation, not chemical application instructions. Follow approved product instructions and seek qualified professional advice.</p>
  </Card>;
}
