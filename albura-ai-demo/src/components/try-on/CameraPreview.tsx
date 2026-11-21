import { Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CameraPreview() {
  return (
    <div className="camera-placeholder">
      <Button disabled variant="secondary"><Camera size={17} aria-hidden="true" /> Use camera</Button>
      <span className="small-note">Coming in a later phase</span>
    </div>
  );
}
