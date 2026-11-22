"use client";

import { BookOpen, Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HairLevelSelector } from "@/components/guide/HairLevelSelector";
import { GuideInputs } from "@/components/guide/GuideInputs";
import { PigmentChart } from "@/components/guide/PigmentChart";
import { SafetyWarnings } from "@/components/guide/SafetyWarnings";
import { useTryOn } from "@/components/try-on/TryOnProvider";
import { formatLift, reflectionNotation } from "@/lib/guide/guide-reference";

export function TechnicalGuide() {
  const { selectedShade: shade, naturalLevel, targetLevel, liftDifference, guideResult } = useTryOn();
  const steps = [
    { title: "Safety assessment", description: "Review hair/scalp condition with a professional. Remember patch and strand testing according to the official product instructions.", status: "Safety reminder" },
    { title: "Review the level difference", description: `${guideResult.classification}. This software category flags a discussion about lift or pre-lightening; it does not authorize a treatment.`, status: "Demo assessment" },
    { title: "Review pigment & reflection", description: `Compare the educational pigment chart with the selected shade reflection: ${reflectionNotation(shade)}. This is a reference, not a correction formula.`, status: "Educational reference" },
    { title: "Refer to approved formulation", description: "Use the official Al Bura product leaflet and a formulation approved by the technical team and a qualified professional. Chemical instructions are not supplied here.", status: "Locked · approval required" },
    { title: "Discuss after-care", description: "Ask a professional about after-care suitable for your hair condition, history and the product used. Refer to the official product leaflet.", status: "Professional consultation" },
  ];
  return <Card className="guide-card" id="technical-guide" aria-labelledby="guide-title">
    <div className="card-heading"><div><p className="eyebrow">WINDOW 2</p><h2 id="guide-title">The technical guide</h2></div><BookOpen size={25} strokeWidth={1.25} aria-hidden="true" /></div>
    <div className="guide-demo-notice"><strong>Unapproved demonstration</strong><span>Educational assessment only · no chemical treatment instructions</span></div>
    <div className="guide-shade-heading"><span className="guide-shade-swatch" style={{ backgroundColor: shade.hex }} aria-hidden="true" /><div><p className="eyebrow">SELECTED DEMO SHADE</p><h3>{shade.name}</h3><p>{shade.code} · {shade.hex}</p></div></div>
    <p className="small-note">Illustrative sample shade values, pending official Al Bura shade-card approval.</p>
    <dl className="guide-shade-details">
      <div><dt>Target level</dt><dd>{targetLevel}</dd></div><div><dt>Natural level</dt><dd>{naturalLevel} · manual</dd></div>
      <div><dt>Reflection</dt><dd>{reflectionNotation(shade)}</dd></div><div><dt>Colour family</dt><dd className="family-name">{shade.family}</dd></div>
      <div><dt>Required lift difference</dt><dd>{formatLift(liftDifference)}</dd></div>
    </dl>
    <HairLevelSelector />
    <GuideInputs />
    <section className="lift-assessment guide-section" aria-labelledby="assessment-title" aria-live="polite" aria-atomic="true">
      <p className="eyebrow">DEMO LIFT ASSESSMENT</p><div className="assessment-heading"><h3 id="assessment-title">{guideResult.classification}</h3><strong className="lift-value" aria-label={`Lift difference ${formatLift(liftDifference)}`}>{formatLift(liftDifference)}</strong></div>
      <p>Target level {targetLevel} − natural level {naturalLevel} = {formatLift(liftDifference)}.</p>
      <p className="small-note">A level difference is a software comparison, not a verified measure of achievable lift. Approval status: <strong>demo_unapproved</strong>.</p>
    </section>
    <PigmentChart />
    <section className="guide-section" aria-labelledby="timeline-title"><h3 id="timeline-title">Your review pathway</h3><p className="small-note">Discussion checkpoints, not an executable chemical procedure.</p>
      <ol className="guide-timeline" start={0}>{steps.map((step, index) => <li key={step.title}><span className="timeline-number" aria-hidden="true">{index}</span><article><span className="timeline-status">{step.status}</span><h4>{step.title}</h4><p>{step.description}</p></article></li>)}</ol>
    </section>
    <SafetyWarnings />
    <div className="guide-print-actions"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print demo guide</Button><p className="small-note">Prints this assessment with its unapproved-demo notice and safety limits. No photo is included.</p></div>
    <p className="print-only print-disclaimer">Al Bura Cosmetics · Unapproved demonstration guide · Not a chemical treatment procedure. Follow official product instructions and seek qualified professional assessment.</p>
  </Card>;
}
