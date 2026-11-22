"use client";

import { LockKeyhole, ShieldAlert } from "lucide-react";
import { useTryOn } from "@/components/try-on/TryOnProvider";
import { LOCKED_GUIDANCE } from "@/lib/guide/guide-reference";

export function SafetyWarnings() {
  const { guideResult } = useTryOn();
  return <aside className="guide-safety guide-section" aria-labelledby="safety-title">
    <div className="safety-heading"><ShieldAlert size={21} aria-hidden="true" /><h3 id="safety-title">Safety limits</h3></div>
    <ul className="safety-reminders">{guideResult.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
    <div className="approval-lock">
      <LockKeyhole size={20} aria-hidden="true" /><div><strong>Awaiting Al Bura Technical Approval</strong><p>Unapproved chemical procedures remain locked.</p></div>
      <ul>{LOCKED_GUIDANCE.map((item) => <li key={item}><span>{item}</span><span>Locked</span></li>)}</ul>
    </div>
  </aside>;
}
