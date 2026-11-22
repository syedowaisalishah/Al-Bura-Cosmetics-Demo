"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CameraOff, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cameraErrorMessage, captureVideoPhoto, stopCameraTracks } from "@/lib/camera";

interface CameraSession { stream: MediaStream | null; stopped: boolean; detach: (() => void) | null }
interface CameraPreviewProps { onCapture: (file: File) => void; onRetake: () => void; hasPhoto: boolean }
type CameraStatus = "stopped" | "requesting" | "preview" | "capturing" | "error";

export function CameraPreview({ onCapture, onRetake, hasPhoto }: CameraPreviewProps) {
  const video = useRef<HTMLVideoElement>(null), session = useRef<CameraSession | null>(null);
  const mounted = useRef(true), captureJob = useRef(0);
  const [status, setStatus] = useState<CameraStatus>("stopped");
  const [error, setError] = useState<string | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const release = useCallback((current: CameraSession | null) => {
    if (!current || current.stopped) return;
    current.stopped = true; current.detach?.(); stopCameraTracks(current.stream); current.stream = null;
  }, []);
  const closeStream = useCallback(() => {
    const current = session.current; session.current = null; release(current);
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
  }, [release]);
  const stopCamera = useCallback((message?: string) => {
    captureJob.current++; closeStream();
    setStatus(message ? "error" : "stopped"); setError(message ?? null);
  }, [closeStream]);
  useEffect(() => {
    mounted.current = true;
    const onVisibility = () => { if (document.hidden) stopCamera(); };
    const onPageHide = () => stopCamera();
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    const source = video.current;
    return () => {
      mounted.current = false; captureJob.current = -1;
      const current = session.current; session.current = null; release(current);
      if (source) { source.pause(); source.srcObject = null; }
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [release, stopCamera]);

  async function openCamera(retake = false) {
    if (session.current || status === "capturing") return;
    if (!window.isSecureContext) { setStatus("error"); setError("Use localhost or HTTPS to enable camera access."); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("error"); setError("This browser does not support camera access. Try a current browser or use Upload Photo."); return; }
    const current: CameraSession = { stream: null, stopped: false, detach: null };
    session.current = current;
    const active = () => mounted.current && session.current === current && !current.stopped;
    captureJob.current++; setError(null); setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 960 }, frameRate: { ideal: 24, max: 30 },
      } });
      if (!active()) { stopCameraTracks(stream); return; }
      current.stream = stream;
      const disconnected = () => { if (active()) stopCamera("The camera disconnected. Reconnect it and try again, or use Upload Photo."); };
      for (const track of stream.getVideoTracks()) track.addEventListener("ended", disconnected, { once: true });
      current.detach = () => { for (const track of stream.getVideoTracks()) track.removeEventListener("ended", disconnected); };
      const source = video.current;
      if (!source) throw new Error("The camera preview is unavailable. Please try again.");
      source.srcObject = stream; await source.play();
      if (!active()) return;
      if (retake) onRetake();
      setStatus("preview");
    } catch (cause) { if (active()) stopCamera(cameraErrorMessage(cause)); else release(current); }
  }
  async function capturePhoto() {
    const source = video.current;
    if (!source || status !== "preview" || !session.current) return;
    const job = ++captureJob.current;
    setStatus("capturing"); setError(null);
    // captureVideoPhoto draws before its first await; release the camera immediately.
    const photo = captureVideoPhoto(source, mirrored);
    closeStream();
    try {
      const file = await photo;
      if (!mounted.current || job !== captureJob.current) return;
      setStatus("stopped"); onCapture(file);
    } catch (cause) {
      if (mounted.current && job === captureJob.current) { setStatus("error"); setError(cameraErrorMessage(cause)); }
    }
  }
  const active = status === "requesting" || status === "preview" || status === "capturing";
  const message = status === "requesting" ? "Waiting for camera permission…" : status === "preview" ? "Normal camera preview. Capture a photo to try your selected shade."
    : status === "capturing" ? "Preparing your captured photo…" : status === "error" ? "Camera is off. Upload Photo is still available."
    : hasPhoto ? "Your captured photo is below. Choose another shade or retake the photo." : "Open your camera, frame your hair, then capture a photo.";
  return <section className="camera-preview" aria-label="Take a photo for hair try-on">
    <div className="camera-actions">
      {!hasPhoto && <Button onClick={() => void openCamera()} disabled={active}><Camera size={17} aria-hidden="true" /> Open Camera</Button>}
      {hasPhoto && <Button onClick={() => void openCamera(true)} disabled={active}><RefreshCw size={17} aria-hidden="true" /> Retake</Button>}
      <Button variant="secondary" onClick={() => stopCamera()} disabled={!active}><CameraOff size={17} aria-hidden="true" /> Stop Camera</Button>
      <Button variant="secondary" onClick={() => void capturePhoto()} disabled={status !== "preview"}><Camera size={17} aria-hidden="true" /> Capture Photo</Button>
    </div>
    <div className="camera-status" role="status" aria-live="polite">{(status === "requesting" || status === "capturing") && <LoaderCircle size={17} className="loading-icon" aria-hidden="true" />}<span>{message}</span></div>
    {error && <div className="tryon-error camera-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{error}</p></div>}
    <div className={`camera-stage${status === "preview" ? " is-active" : ""}`} hidden={hasPhoto && !active}>
      <video ref={video} autoPlay playsInline muted className={mirrored ? "is-mirrored" : ""} aria-label="Normal camera preview" />
      {status !== "preview" && <div className="camera-idle"><Camera size={35} strokeWidth={1.25} aria-hidden="true" /><p>Frame your next colour</p><span>Camera access starts only when you choose Open Camera or Retake.</span></div>}
      {status === "preview" && <span className="camera-frame-label">Camera preview</span>}
    </div>
    {status === "preview" && <div className="camera-controls"><label><input type="checkbox" checked={mirrored} onChange={(event) => setMirrored(event.target.checked)} /> Mirror selfie</label><span className="small-note">The saved photo matches this preview.</span></div>}
    <p className="small-note camera-privacy">Your camera shows normal video. AI runs once after capture; photos and results stay on your device.</p>
  </section>;
}
