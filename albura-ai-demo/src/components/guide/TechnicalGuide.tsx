import { BookOpen, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { HairLevelSelector } from "@/components/guide/HairLevelSelector";
import { SafetyWarnings } from "@/components/guide/SafetyWarnings";

export function TechnicalGuide() {
  return (
    <Card className="guide-card" id="technical-guide" aria-labelledby="guide-title">
      <div className="card-heading">
        <div><p className="eyebrow">WINDOW 2</p><h2 id="guide-title">The technical guide</h2></div>
        <BookOpen size={25} strokeWidth={1.25} aria-hidden="true" />
      </div>
      <div className="guide-intro"><Sparkles size={22} strokeWidth={1.25} aria-hidden="true" /><h3>A little guidance,<br />a more considered colour.</h3><p>This space will bring your starting hair level and chosen shade together.</p></div>
      <HairLevelSelector />
      <dl className="guide-summary"><div><dt>Chosen shade</dt><dd>Awaiting selection</dd></div><div><dt>Colour guidance</dt><dd>Coming next</dd></div></dl>
      <SafetyWarnings />
      <p className="small-note guide-approval">Technical recommendations await brand-approved rules.</p>
    </Card>
  );
}
