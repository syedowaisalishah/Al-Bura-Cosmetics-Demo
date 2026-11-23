"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { Button } from "@/web/components/ui/Button";

interface PhotoUploaderProps { hasPhoto: boolean; onFile: (file: File) => void; onReset: () => void }
export function PhotoUploader({ hasPhoto, onFile, onReset }: PhotoUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  function drop(event: DragEvent) { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) onFile(file); }
  return (
    <div className={`${hasPhoto ? "upload-actions" : "upload-placeholder"}${dragging ? " is-dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <input ref={input} className="sr-only" id="portrait-file" type="file" tabIndex={-1} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        aria-label="Upload portrait photo" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onFile(file); }} />
      {!hasPhoto && <><span className="placeholder-icon"><ImagePlus size={32} strokeWidth={1.25} aria-hidden="true" /></span><h3>Picture your next colour</h3><p>A little light. Your favourite portrait.<br />A whole palette of possibilities.</p><span className="upload-hint">Drop your photo here, or choose a file below</span></>}
      <Button onClick={() => input.current?.click()} variant={hasPhoto ? "secondary" : "primary"}><Upload size={17} aria-hidden="true" /> {hasPhoto ? "Replace photo" : "Upload a photo"}</Button>
      {hasPhoto && <Button variant="secondary" onClick={onReset}>Reset</Button>}
      <span className="small-note">JPG, PNG or WebP · up to 15 MB · processed on your device</span>
    </div>
  );
}
