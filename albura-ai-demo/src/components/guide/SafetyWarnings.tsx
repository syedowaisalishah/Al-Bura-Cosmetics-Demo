import { Info } from "lucide-react";

export function SafetyWarnings() {
  return (
    <aside className="safety-note" aria-label="Colour guidance notice">
      <Info size={18} aria-hidden="true" />
      <p>Virtual previews are illustrative. Follow the product manufacturer’s instructions and seek professional advice before applying hair colour.</p>
    </aside>
  );
}
