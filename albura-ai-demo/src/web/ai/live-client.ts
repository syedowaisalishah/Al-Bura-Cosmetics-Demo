import { HAIR_MODEL_PATH, HAIR_GUARD_PATH, VISION_WASM_PATH } from "@/web/ai/mediapipe";
import type { Shade } from "@/shared/types/shade";
import type { LiveDelegate, LiveFrame, LivePreference, LiveRequest, LiveResponse } from "@/web/types/live-camera";

export interface LiveClient {
  delegate: LiveDelegate;
  fallbackReason: string | null;
  processFrame(source: HTMLCanvasElement, timestampMs: number, shade: Shade, intensity?: number): Promise<LiveFrame>;
  close(): void;
}
function connectLive(delegate: LiveDelegate, signal?: AbortSignal, allowSoftwareGpu = true): Promise<LiveClient> {
  if (typeof window === "undefined" || typeof Worker === "undefined" || typeof createImageBitmap !== "function") return Promise.reject(new Error("This browser does not support live AI. Use Take Photo or Upload Photo."));
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/live-hair-segmenter.js");
    let closed = false, id = 0, inFlight = false;
    const pending = new Map<number, { resolve: (result: LiveFrame) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
    const initTimer = setTimeout(() => close(new Error(`${delegate} live models took too long to load.`)), 30000);
    function close(error = new Error("Live analysis was cancelled.")) {
      if (closed) return; closed = true; clearTimeout(initTimer); worker.terminate(); signal?.removeEventListener("abort", abort);
      reject(error);
      for (const task of pending.values()) { clearTimeout(task.timer); task.reject(error); }
      pending.clear();
    }
    const abort = () => close();
    const client: LiveClient = {
      delegate, fallbackReason: null, close: () => close(),
      async processFrame(source, timestampMs, shade, intensity = .7) {
        if (closed) throw new Error("The live model is closed.");
        if (inFlight) throw new Error("A live frame is already processing.");
        inFlight = true;
        try {
          const image = await createImageBitmap(source);
          if (closed) { image.close(); throw new Error("Live analysis was cancelled."); }
          return await new Promise<LiveFrame>((resolveFrame, rejectFrame) => {
            const requestId = ++id, timer = setTimeout(() => close(new Error("Live analysis timed out. Use Take Photo for a stable result.")), 15000);
            pending.set(requestId, { resolve: resolveFrame, reject: rejectFrame, timer });
            try { worker.postMessage({ type: "frame", id: requestId, image, timestampMs, shade, intensity } satisfies LiveRequest, [image]); }
            catch (cause) { image.close(); clearTimeout(timer); pending.delete(requestId); rejectFrame(cause); }
          });
        } finally { inFlight = false; }
      },
    };
    worker.onmessage = ({ data }: MessageEvent<LiveResponse>) => {
      if (data.type === "ready") { clearTimeout(initTimer); resolve(client); return; }
      if (data.type === "error" && data.id === null) { close(new Error(data.message)); return; }
      const task = pending.get(data.id as number);
      if (!task) { if (data.type === "frame") data.result.frame.close(); return; }
      pending.delete(data.id as number); clearTimeout(task.timer);
      if (data.type === "error") task.reject(new Error(data.message)); else task.resolve(data.result);
    };
    worker.onerror = () => close(new Error(`${delegate} live processing could not start. Use CPU processing or Take Photo.`));
    if (signal?.aborted) { close(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    try { worker.postMessage({ type: "init", modelPath: HAIR_MODEL_PATH, guardPath: HAIR_GUARD_PATH, wasmPath: VISION_WASM_PATH, delegate, allowSoftwareGpu } satisfies LiveRequest); }
    catch (cause) { close(cause instanceof Error ? cause : new Error("The live worker could not start.")); }
  });
}

/** GPU fallback uses a fresh worker/native pair; the IMAGE singleton is never reconfigured. */
export async function createLiveClient(preference: LivePreference = "auto", signal?: AbortSignal): Promise<LiveClient> {
  let current: LiveClient;
  let fallbackReason: string | null = null;
  try { current = await connectLive(preference === "auto" ? "GPU" : preference, signal, preference !== "auto"); }
  catch (cause) {
    if (preference !== "auto" || signal?.aborted) throw cause;
    current = await connectLive("CPU", signal); fallbackReason = "GPU acceleration is unavailable or software-rendered. Using CPU processing.";
  }
  let closed = false, processing = false;
  return {
    get delegate() { return current.delegate; },
    get fallbackReason() { return fallbackReason; },
    close() { closed = true; current.close(); },
    async processFrame(source, timestampMs, shade, intensity = .7) {
      if (processing) throw new Error("A live frame is already processing.");
      if (closed) throw new Error("The live model is closed.");
      processing = true;
      try {
        try { return await current.processFrame(source, timestampMs, shade, intensity); }
        catch (cause) {
          if (closed || signal?.aborted || preference !== "auto" || current.delegate !== "GPU") throw cause;
          current.close();
          current = await connectLive("CPU", signal);
          if (closed || signal?.aborted) { current.close(); throw new Error("Live analysis was cancelled."); }
          fallbackReason = "GPU processing stopped. Switched to CPU; Take Photo is recommended for a stable result.";
          return await current.processFrame(source, timestampMs, shade, intensity);
        }
      } finally { processing = false; }
    },
  };
}
