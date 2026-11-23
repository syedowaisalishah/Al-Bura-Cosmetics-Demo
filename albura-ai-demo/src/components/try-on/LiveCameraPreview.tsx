"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CameraOff, LoaderCircle, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTryOn } from "@/components/try-on/TryOnProvider";
import { cameraErrorMessage, captureVideoPhoto, stopCameraTracks } from "@/lib/camera";
import { createLiveClient, type LiveClient } from "@/lib/ai/live-client";
import { LIVE_INTERVAL_MS, liveDimensions, LiveQuality } from "@/lib/ai/live-utils";
import type { LivePreference } from "@/types/live-camera";

interface LiveSession { stream: MediaStream | null; client: LiveClient | null; abort: AbortController; raf: number | null; stopped: boolean; detach: (() => void) | null }
type LiveStatus = "stopped" | "requesting" | "loading" | "processing" | "running" | "capturing" | "error";
export function LiveCameraPreview({ onCapture, onTakePhoto }: { onCapture: (file: File) => void; onTakePhoto: () => void }) {
  const { selectedShade } = useTryOn(), shade = useRef(selectedShade);
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), session = useRef<LiveSession | null>(null);
  const mounted = useRef(true), captureJob = useRef(0), lastHair = useRef(false), renderedShade = useRef<string | null>(null);
  const [status, setStatus] = useState<LiveStatus>("stopped"), [error, setError] = useState<string | null>(null);
  const [preference, setPreference] = useState<LivePreference>("auto");
  const [hasVideo, setHasVideo] = useState(false), [hasFrame, setHasFrame] = useState(false), [hasHair, setHasHair] = useState(false);
  const [frameShade, setFrameShade] = useState<string | null>(null), [showOriginal, setShowOriginal] = useState(false), [mirrored, setMirrored] = useState(true);
  const [metrics, setMetrics] = useState({ fps: 0, width: 320, height: 240, delegate: "", fallback: "", slow: false });
  useEffect(() => { shade.current = selectedShade; }, [selectedShade]);
  const release = useCallback((current: LiveSession | null) => {
    if (!current || current.stopped) return;
    current.stopped = true;
    if (current.raf !== null) cancelAnimationFrame(current.raf);
    current.abort.abort(); current.client?.close(); current.detach?.(); stopCameraTracks(current.stream);
    current.client = null; current.stream = null;
  }, []);
  const closeStream = useCallback(() => {
    const current = session.current; session.current = null; release(current);
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
    const output = canvas.current;
    if (output) { output.getContext("2d")?.clearRect(0, 0, output.width, output.height); output.dataset.frames = "0"; delete output.dataset.shadeId; delete output.dataset.hairPixels; }
    renderedShade.current = null; lastHair.current = false;
    setHasVideo(false); setHasFrame(false); setHasHair(false); setFrameShade(null);
  }, [release]);
  const stop = useCallback((message?: string) => {
    captureJob.current++; closeStream(); setStatus(message ? "error" : "stopped"); setError(message ?? null);
  }, [closeStream]);
  useEffect(() => {
    mounted.current = true;
    const hide = () => { if (document.hidden) stop(); }, leave = () => stop();
    document.addEventListener("visibilitychange", hide); window.addEventListener("pagehide", leave);
    const source = video.current;
    return () => {
      mounted.current = false; captureJob.current = -1;
      const current = session.current; session.current = null; release(current);
      if (source) { source.pause(); source.srcObject = null; }
      document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", leave);
    };
  }, [release, stop]);

  async function start() {
    if (session.current || status === "capturing") return;
    if (!window.isSecureContext) { setError("Use localhost or HTTPS to enable camera access."); setStatus("error"); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setError("This browser does not support camera access. Use Upload Photo."); setStatus("error"); return; }
    const current: LiveSession = { stream: null, client: null, abort: new AbortController(), raf: null, stopped: false, detach: null };
    session.current = current; captureJob.current++;
    const active = () => mounted.current && session.current === current && !current.stopped;
    setError(null); setStatus("requesting"); setMetrics({ fps: 0, width: 320, height: 240, delegate: "", fallback: "", slow: false });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 960 }, frameRate: { ideal: 24, max: 30 } } });
      if (!active()) { stopCameraTracks(stream); return; }
      current.stream = stream;
      const ended = () => { if (active()) stop("The camera disconnected. Reconnect it, or use Upload Photo."); };
      for (const track of stream.getVideoTracks()) track.addEventListener("ended", ended, { once: true });
      current.detach = () => { for (const track of stream.getVideoTracks()) track.removeEventListener("ended", ended); };
      const source = video.current, output = canvas.current;
      if (!source || !output) throw new Error("The live preview is unavailable.");
      source.srcObject = stream; await source.play();
      if (!active()) return;
      setHasVideo(true); setStatus("loading");
      current.client = await createLiveClient(preference, current.abort.signal);
      if (!active()) { current.client.close(); return; }
      const input = document.createElement("canvas"), context = input.getContext("2d"), destination = output.getContext("2d");
      if (!context || !destination) throw new Error("Canvas 2D is unavailable. Use Take Photo.");
      const quality = new LiveQuality();
      let busy = false, lastStart = -Infinity, lastVideoTime = -1, first = true, total = 0, frames = 0, reportStart = performance.now();
      setStatus("processing");
      const tick = (timestampMs: number) => {
        if (!active()) return;
        current.raf = requestAnimationFrame(tick);
        if (busy || timestampMs - lastStart < LIVE_INTERVAL_MS || source.readyState < 2 || source.currentTime === lastVideoTime) return;
        busy = true; lastStart = timestampMs; lastVideoTime = source.currentTime;
        const started = performance.now();
        void (async () => {
          const size = liveDimensions(source.videoWidth, source.videoHeight, quality.limit);
          if (input.width !== size.width || input.height !== size.height) { input.width = size.width; input.height = size.height; }
          context.drawImage(source, 0, 0, input.width, input.height);
          const result = await current.client!.processFrame(input, timestampMs, shade.current);
          try {
            if (!active()) return;
            // Model tensors stay 512/256 regardless of input size. Downscale only
            // when pixel/transfer work is slow, preserving detail on inference-bound CPUs.
            quality.record(Math.max(0, performance.now() - started - result.inferenceMs));
            if (result.shadeId !== shade.current.id) return;
            if (output.width !== result.width || output.height !== result.height) { output.width = result.width; output.height = result.height; }
            destination.drawImage(result.frame, 0, 0);
            output.dataset.frames = String(++total); output.dataset.shadeId = result.shadeId; output.dataset.hairPixels = String(result.hairPixels);
            output.dataset.inferenceMs = result.inferenceMs.toFixed(1); output.dataset.maskMs = result.maskMs.toFixed(1); output.dataset.recolorMs = result.recolorMs.toFixed(1);
            if (first) { first = false; setHasFrame(true); setStatus("running"); }
            if (renderedShade.current !== result.shadeId) { renderedShade.current = result.shadeId; setFrameShade(result.shadeId); }
            const hair = result.hairPixels > 0;
            if (lastHair.current !== hair) { lastHair.current = hair; setHasHair(hair); }
            frames++;
            const now = performance.now();
            if (now - reportStart >= 1000) {
              const fps = frames * 1000 / (now - reportStart);
              setMetrics({ fps, width: result.width, height: result.height, delegate: current.client!.delegate, fallback: current.client!.fallbackReason ?? "", slow: fps < 5 });
              frames = 0; reportStart = now;
            }
          } finally { result.frame.close(); }
        })().catch((cause: unknown) => { if (active()) stop(`Live AI stopped. ${cameraErrorMessage(cause)} Take Photo and Upload Photo are still available.`); })
          .finally(() => { busy = false; });
      };
      current.raf = requestAnimationFrame(tick);
    } catch (cause) { if (active()) stop(cameraErrorMessage(cause)); else release(current); }
  }
  async function captureOriginal() {
    const source = video.current;
    if (!hasVideo || !source || !session.current) return;
    const job = ++captureJob.current;
    setStatus("capturing");
    const file = captureVideoPhoto(source, mirrored); // Freeze RAW video, never the processed canvas.
    closeStream();
    try {
      const photo = await file;
      if (mounted.current && job === captureJob.current) { setStatus("stopped"); onCapture(photo); }
    } catch (cause) { if (mounted.current && job === captureJob.current) { setStatus("error"); setError(cameraErrorMessage(cause)); } }
  }
  const active = !["stopped", "error"].includes(status);
  const message = status === "running" ? frameShade !== selectedShade.id ? "Applying the selected shade…" : hasHair ? "Live hair colour preview is running." : "No clear hair detected. Show your hair in even light, or use Take Photo."
    : status === "requesting" ? "Waiting for camera permission…" : status === "loading" ? "Camera connected. Loading live AI…" : status === "processing" ? "Finding hair in the first frame…"
    : status === "capturing" ? "Preparing the original camera photo…" : status === "error" ? "Live camera is off." : "Start the camera to explore live colour.";
  return <section className="camera-preview live-preview" aria-label="Experimental live hair preview">
    <div className="live-notice"><ScanFace size={20} aria-hidden="true" /><div><strong>Experimental Live Preview</strong><p>Take Photo is recommended for finer hair detail and stable before/after results.</p></div></div>
    <label className="live-processing" htmlFor="live-processing">Processing<select id="live-processing" value={preference} disabled={active} onChange={(event) => setPreference(event.target.value as LivePreference)}><option value="auto">Automatic (GPU with CPU fallback)</option><option value="CPU">CPU compatibility</option><option value="GPU">GPU acceleration</option></select></label>
    <div className="camera-actions"><Button onClick={() => void start()} disabled={active}><Camera size={17} aria-hidden="true" /> Start Live Camera</Button><Button variant="secondary" onClick={() => stop()} disabled={!active}><CameraOff size={17} aria-hidden="true" /> Stop Camera</Button></div>
    <div className="camera-status" role="status" aria-live="polite">{active && status !== "running" && <LoaderCircle size={17} className="loading-icon" aria-hidden="true" />}<span>{message}</span></div>
    {error && <div className="tryon-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{error}</p></div>}
    <div className={`camera-stage live-stage${hasVideo ? " is-active" : ""}`}>
      <video ref={video} playsInline muted autoPlay className={mirrored ? "is-mirrored" : ""} aria-label="Original live camera video" />
      <canvas ref={canvas} className={`${hasFrame && !showOriginal ? "is-visible" : ""}${mirrored ? " is-mirrored" : ""}`} aria-label="AI recoloured live video" />
      {!hasVideo && <div className="camera-idle"><Camera size={35} aria-hidden="true" /><p>Explore live colour</p><span>Experimental preview · results depend on your device and lighting.</span></div>}
      {hasVideo && <span className="camera-frame-label">{hasFrame && !showOriginal ? "Experimental AI preview" : "Original camera"}</span>}
    </div>
    {hasVideo && <div className="camera-controls"><label><input type="checkbox" checked={showOriginal} onChange={(event) => setShowOriginal(event.target.checked)} /> Show original</label><label><input type="checkbox" checked={mirrored} onChange={(event) => setMirrored(event.target.checked)} /> Mirror selfie</label></div>}
    {active && status !== "capturing" && <p className="live-metrics">{metrics.fps ? `${metrics.fps.toFixed(1)} measured FPS · ${metrics.delegate} · ${metrics.width} × ${metrics.height}` : "Measuring live preview speed…"}</p>}
    {metrics.fallback && active && <p className="small-note">{metrics.fallback}</p>}
    {metrics.slow && active && <p className="live-slow">This device is processing slowly. Take Photo is recommended; it uses the full captured image.</p>}
    <div className="live-capture"><Button variant="secondary" onClick={() => hasVideo ? void captureOriginal() : onTakePhoto()} disabled={status === "capturing"}>Take Photo (recommended)</Button><p className="small-note">Captures the original camera feed, then runs the still-image AI once. Colour changes, comparison and download are available afterward.</p></div>
    <p className="small-note camera-privacy">Video, captured photos and AI processing stay in your browser. Switching modes stops the live camera.</p>
  </section>;
}
