import { ScanFace } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PhotoUploader } from "@/components/try-on/PhotoUploader";
import { CameraPreview } from "@/components/try-on/CameraPreview";
import { BeforeAfterSlider } from "@/components/try-on/BeforeAfterSlider";

export function HairTryOn() {
  return (
    <Card className="tryon-card" aria-labelledby="tryon-title">
      <div className="card-heading">
        <div><p className="eyebrow">WINDOW 1</p><h2 id="tryon-title">Your colour preview</h2></div>
        <ScanFace size={25} strokeWidth={1.25} aria-hidden="true" />
      </div>
      <PhotoUploader />
      <CameraPreview />
      <BeforeAfterSlider />
    </Card>
  );
}
