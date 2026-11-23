"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, Download, LoaderCircle, RotateCcw, ScanFace } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PhotoUploader } from "@/components/try-on/PhotoUploader";
import { BeforeAfterSlider } from "@/components/try-on/BeforeAfterSlider";
import { LiveCameraPreview } from "@/components/try-on/LiveCameraPreview";
import { CameraPreview } from "@/components/try-on/CameraPreview";
import { useTryOn } from "@/components/try-on/TryOnProvider";
import { loadHairSegmenter, disposeHairSegmenter } from "@/lib/ai/mediapipe";
import { segmentHair } from "@/lib/ai/hair-segmentation";
import { createMaskOverlay, refineHairMask } from "@/lib/ai/mask-utils";
import { prepareHairColor, recolorHair, type HairColorCache } from "@/lib/ai/hair-recolor";
import { pixelsToUrl, preparePhoto, validatePhoto, type PreparedPhoto } from "@/lib/ai/photo-utils";
import { analysePhoto } from "@/lib/ai/photo-analysis";
import type { TryOnStatus } from "@/types/try-on";

const DEBUG_MASK = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ENABLE_MASK_DEBUG === "true";
const paint = () => new Promise<void>((resolve) => setTimeout(resolve, 32));
const messages: Record<TryOnStatus, string> = {
  idle: "Your photo stays on your device.", decoding: "Preparing your photo…", "loading-model": "Loading the AI hair model…",
  processing: "AI is finding your hair…", refining: "Refining hair edges and texture…", rendering: "Applying your selected shade…",
  ready: "Your colour preview is ready.", error: "Your photo is ready for another try.",
};

export function HairTryOn({ active = true }: { active?: boolean }) {
  const { selectedShade: selected, beginAnalysis, clearAnalysis, publishAnalysis, photoAnalysis } = useTryOn();
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [mode, setMode] = useState<"photo" | "live" | "camera">("photo");
  const [photoSource, setPhotoSource] = useState<"upload" | "camera" | null>(null);
  const modeButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [renderedShadeId, setRenderedShadeId] = useState<string | null>(null);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const [showMask, setShowMask] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [cacheVersion, setCacheVersion] = useState(0);
  const photo = useRef<PreparedPhoto | null>(null), cache = useRef<HairColorCache | null>(null);
  const photoJob = useRef(0), photoAbort = useRef<AbortController | null>(null), renderAbort = useRef<AbortController | null>(null);
  const urls = useRef(new Map<string, string>());
  const displayStatus = status === "ready" && renderedShadeId !== selected.id ? "rendering" : status;
  const busy = !["idle", "ready", "error"].includes(displayStatus);

  function ownUrl(kind: string, url: string) {
    const previous = urls.current.get(kind); if (previous) URL.revokeObjectURL(previous);
    urls.current.set(kind, url); return url;
  }
  function invalidate() {
    clearAnalysis();
    photoJob.current++; photoAbort.current?.abort(); renderAbort.current?.abort();
    for (const url of urls.current.values()) URL.revokeObjectURL(url);
    urls.current.clear(); photo.current = null; cache.current = null;
    setOriginalUrl(null); setResultUrl(null); setRenderedShadeId(null); setMaskUrl(null); setShowMask(false); setError(null);
    return photoJob.current;
  }
  function reset() { invalidate(); setPhotoSource(null); setStatus("idle"); }

  useEffect(() => {
    const ownedUrls = urls.current;
    return () => {
      photoJob.current = -1; photoAbort.current?.abort(); renderAbort.current?.abort();
      for (const url of ownedUrls.values()) URL.revokeObjectURL(url);
      ownedUrls.clear(); photo.current = null; cache.current = null; disposeHairSegmenter();
    };
  }, []);

  async function analyze(prepared: PreparedPhoto, job: number, source: "upload" | "camera" = photoSource ?? "upload") {
    beginAnalysis();
    const controller = new AbortController(); photoAbort.current = controller;
    const current = () => job === photoJob.current && !controller.signal.aborted;
    try {
      setStatus("loading-model"); await paint();
      await loadHairSegmenter(); if (!current()) return;
      setStatus("processing"); await paint(); if (!current()) return;
      const segmentation = await segmentHair(prepared.canvas); if (!current()) return;
      setStatus("refining"); await paint(); if (!current()) return;
      const mask = refineHairMask(segmentation, prepared.pixels.width, prepared.pixels.height);
      if (mask.hairPixels < Math.max(32, mask.alpha.length * 0.001) || mask.hairPixels > mask.alpha.length * 0.95) {
        throw new Error("No clear hair region was detected. Try a closer portrait with visible hair, a simple background, and even lighting.");
      }
      const preparedCache = await prepareHairColor(prepared.pixels, mask, controller.signal);
      if (!current()) return;
      if (DEBUG_MASK) {
        const url = await pixelsToUrl(createMaskOverlay(prepared.pixels, mask));
        if (!current()) { URL.revokeObjectURL(url); return; }
        setMaskUrl(ownUrl("mask", url));
      }
      publishAnalysis(analysePhoto(preparedCache, source));
      cache.current = preparedCache; setCacheVersion((v) => v + 1);
    } catch (cause) {
      if (!current()) return;
      clearAnalysis(); setStatus("error");
      setError(cause instanceof Error ? cause.message : "Hair analysis failed. Please try again.");
    }
  }

  // Both the file picker and camera capture enter this exact IMAGE pipeline.
  async function processPhoto(file: File, source: "upload" | "camera") {
    try { validatePhoto(file); } catch (cause) { setError(cause instanceof Error ? cause.message : "Please choose another photo."); return; }
    const job = invalidate(); setPhotoSource(source); setStatus("decoding");
    try {
      const prepared = await preparePhoto(file);
      if (job !== photoJob.current) { URL.revokeObjectURL(prepared.previewUrl); return; }
      photo.current = prepared;
      setOriginalUrl(ownUrl("original", prepared.previewUrl));
      setDimensions({ width: prepared.pixels.width, height: prepared.pixels.height });
      await analyze(prepared, job, source);
    } catch (cause) {
      if (job !== photoJob.current) return;
      setStatus("error"); setError(cause instanceof Error ? cause.message : "This photo could not be opened.");
    }
  }

  useEffect(() => {
    const currentCache = cache.current; if (!currentCache || mode === "live") return;
    const controller = new AbortController(); renderAbort.current?.abort(); renderAbort.current = controller;
    const job = photoJob.current;
    const current = () => !controller.signal.aborted && job === photoJob.current;
    void (async () => {
      await paint(); if (!current()) return;
      setStatus("rendering"); setError(null);
      try {
        const pixels = await recolorHair({ cache: currentCache, shade: selected, signal: controller.signal });
        if (!current()) return;
        const url = await pixelsToUrl(pixels);
        if (!current()) { URL.revokeObjectURL(url); return; }
        const previous = urls.current.get("result"); if (previous) URL.revokeObjectURL(previous);
        urls.current.set("result", url); setResultUrl(url); setRenderedShadeId(selected.id); setStatus("ready");
      } catch (cause) {
        if (!current()) return;
        setStatus("error"); setError(cause instanceof Error ? cause.message : "Colour rendering failed.");
      }
    })();
    return () => controller.abort();
  }, [selected, cacheVersion, mode]);

  function download() {
    if (!resultUrl || displayStatus !== "ready") return;
    const link = document.createElement("a"); link.href = resultUrl; link.download = `albura-${selected.code.replace(/[^\w.-]/g, "-")}.png`;
    document.body.append(link); link.click(); link.remove();
  }
  function modeKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const modes = ["photo", "live", "camera"] as const;
    const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : null;
    if (next === null) return;
    event.preventDefault(); setMode(modes[next]); modeButtons.current[next]?.focus();
  }

  return <Card className="tryon-card" aria-labelledby="tryon-title">
        <div className="card-heading"><div><p className="eyebrow">01 / THE TRY-ON</p><h2 id="tryon-title">Your colour preview</h2></div><ScanFace size={25} strokeWidth={1.25} aria-hidden="true" /></div>
        <div className="selected-shade"><span style={{ backgroundColor: selected.hex }} aria-hidden="true" /><p><strong>{selected.name}</strong><span>{selected.code} · {selected.hex}</span></p></div>
        <div className="tryon-mode-tabs" role="tablist" aria-label="Hair try-on modes">
          <button id="photo-mode-tab" ref={(element) => { modeButtons.current[0] = element; }} type="button" role="tab" aria-selected={mode === "photo"} aria-controls="photo-mode-panel" tabIndex={mode === "photo" ? 0 : -1} onClick={() => setMode("photo")} onKeyDown={(event) => modeKeys(event, 0)}>Upload Photo</button>
          <button id="live-mode-tab" ref={(element) => { modeButtons.current[1] = element; }} type="button" role="tab" aria-label="Live AI Camera (Experimental)" aria-selected={mode === "live"} aria-controls="live-mode-panel" tabIndex={mode === "live" ? 0 : -1} onClick={() => setMode("live")} onKeyDown={(event) => modeKeys(event, 1)}>Live AI Camera<span className="mode-note">Experimental</span></button>
          <button id="camera-mode-tab" ref={(element) => { modeButtons.current[2] = element; }} type="button" role="tab" aria-selected={mode === "camera"} aria-controls="camera-mode-panel" tabIndex={mode === "camera" ? 0 : -1} onClick={() => setMode("camera")} onKeyDown={(event) => modeKeys(event, 2)}>Take Photo<span className="mode-note">Recommended</span></button>
        </div>
        <div id="photo-mode-panel" role="tabpanel" aria-labelledby="photo-mode-tab" hidden={mode !== "photo"}>
        <PhotoUploader hasPhoto={Boolean(originalUrl)} onFile={(file) => void processPhoto(file, "upload")} onReset={reset} />
        </div>
        <div id="live-mode-panel" role="tabpanel" aria-labelledby="live-mode-tab" hidden={mode !== "live"}>
          {mode === "live" && active && <LiveCameraPreview onCapture={(file) => { setMode("camera"); void processPhoto(file, "camera"); }} onTakePhoto={() => setMode("camera")} />}
        </div>
        <div id="camera-mode-panel" role="tabpanel" aria-labelledby="camera-mode-tab" hidden={mode !== "camera"}>
          {mode === "camera" && active && <CameraPreview hasPhoto={photoSource === "camera"} onCapture={(file) => void processPhoto(file, "camera")} onRetake={reset} />}
        </div>
        <div className="photo-result" aria-label="Photo colour result" aria-busy={busy} hidden={mode === "live"}>
        <div className="processing-status" role="status" aria-live="polite" aria-atomic="true">{busy && <LoaderCircle size={17} className="loading-icon" aria-hidden="true" />}<span>{messages[displayStatus]}</span></div>
        {error && <div className="tryon-error" role="alert"><AlertCircle size={19} aria-hidden="true" /><div><p>{error}</p>{originalUrl && !busy && <Button variant="secondary" onClick={() => { setError(null); if (cache.current) setCacheVersion((v) => v + 1); else if (photo.current) void analyze(photo.current, photoJob.current); }}>Retry preview</Button>}</div></div>}
        {originalUrl && <><p className="photo-source">{photoSource === "camera" ? "Captured photo" : "Uploaded photo"} · before and after</p><BeforeAfterSlider key={originalUrl} originalUrl={originalUrl} resultUrl={resultUrl} width={dimensions.width} height={dimensions.height} debugUrl={showMask ? maskUrl : null} /></>}
        {DEBUG_MASK && maskUrl && <label className="debug-toggle"><input type="checkbox" checked={showMask} onChange={(event) => setShowMask(event.target.checked)} /> Show AI hair mask (development)</label>}
        {photoAnalysis && <a className="photo-consultation-link" href="#technical-guide">Photo estimate: level {photoAnalysis.estimatedLevel}. Confirm your starting level in Window 2.</a>}
        {originalUrl && <div className="download-row"><Button onClick={download} disabled={displayStatus !== "ready" || !resultUrl}><Download size={17} aria-hidden="true" /> Download Result</Button><a className="button button-secondary" href="#palette-title">Change Shade</a><span className="small-note">{dimensions.width} × {dimensions.height} px · PNG</span></div>}
        {originalUrl && mode === "camera" && <Button className="reset-result" variant="secondary" onClick={reset}><RotateCcw size={16} aria-hidden="true" /> Reset</Button>}
        </div>
        <p className="preview-disclaimer">AI visual preview only. Actual colour results may vary.</p>
      </Card>;
}
