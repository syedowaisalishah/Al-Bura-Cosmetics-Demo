import { ChevronDown } from "lucide-react";

export function HairLevelSelector() {
  return (
    <div className="field">
      <label htmlFor="hair-level">Your current hair level</label>
      <div className="select-wrap">
        <select id="hair-level" disabled defaultValue="" aria-describedby="hair-level-note">
          <option value="">Choose a hair level</option>
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
      <p className="small-note" id="hair-level-note">Available when the technical guide is introduced.</p>
    </div>
  );
}
