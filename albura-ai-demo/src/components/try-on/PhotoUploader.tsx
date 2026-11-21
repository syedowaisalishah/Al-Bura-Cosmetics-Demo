import { ImagePlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PhotoUploader() {
  return (
    <div className="upload-placeholder">
      <span className="placeholder-icon"><ImagePlus size={32} strokeWidth={1.25} aria-hidden="true" /></span>
      <h3>Picture your next colour</h3>
      <p>A clear, front-facing portrait will be the starting point for your virtual try-on.</p>
      <Button disabled aria-describedby="upload-status"><Upload size={17} aria-hidden="true" /> Upload a photo</Button>
      <span id="upload-status" className="small-note">Photo upload will be available in the next phase.</span>
    </div>
  );
}
