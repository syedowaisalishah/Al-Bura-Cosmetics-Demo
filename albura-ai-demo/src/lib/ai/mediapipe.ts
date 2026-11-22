import type { ImageSegmenter as ImageSegmenterInstance } from "@mediapipe/tasks-vision";
import { HAIR_MODEL_LABELS, HAIR_GUARD_LABELS } from "@/lib/ai/mask-utils";
import type { HairSegmentationResult } from "@/types/try-on";
import type { VisionRequest, VisionResponse } from "@/types/vision-worker";

export const HAIR_MODEL_PATH = process.env.NEXT_PUBLIC_HAIR_MODEL_PATH || "/models/hair_segmenter.tflite";
export const VISION_WASM_PATH = process.env.NEXT_PUBLIC_VISION_WASM_PATH || "/wasm";
export const HAIR_GUARD_PATH = process.env.NEXT_PUBLIC_HAIR_GUARD_MODEL_PATH || "/models/selfie_multiclass_256x256.tflite";

async function createVerifiedSegmenter(modelPath: string, wasmPath: string, expectedLabels: readonly string[]): Promise<ImageSegmenterInstance> {
  if (typeof window === "undefined" && typeof self === "undefined") throw new Error("Hair segmentation can only be initialized in a browser.");
  const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(wasmPath);
  const segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: modelPath, delegate: "CPU" },
    runningMode: "IMAGE", outputCategoryMask: true, outputConfidenceMasks: true,
  });
  const labels = segmenter.getLabels();
  if (labels.length !== expectedLabels.length || labels.some((label, i) => label !== expectedLabels[i])) {
    segmenter.close(); throw new Error(`Unexpected model labels: ${labels.join(", ")}. Expected ${expectedLabels.join(", ")}.`);
  }
  return segmenter;
}
export function createHairSegmenter(options: { modelPath?: string; wasmPath?: string } = {}) {
  return createVerifiedSegmenter(options.modelPath ?? HAIR_MODEL_PATH, options.wasmPath ?? VISION_WASM_PATH, HAIR_MODEL_LABELS);
}
export function createHairGuard(modelPath: string, wasmPath: string) {
  return createVerifiedSegmenter(modelPath, wasmPath, HAIR_GUARD_LABELS);
}

export interface HairSegmenterClient {
  getLabels(): string[];
  segment(source: HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<HairSegmentationResult>;
  close(): void;
}
let modelPromise: Promise<HairSegmenterClient> | null = null;
let activeClient: HairSegmenterClient | null = null;

/** One IMAGE worker handles both uploaded and camera-captured photos. */
function createWorkerClient(): Promise<HairSegmenterClient> {
  if (typeof window === "undefined") return Promise.reject(new Error("Hair segmentation can only be initialized in a browser."));
  if (typeof Worker === "undefined" || typeof createImageBitmap !== "function") return Promise.reject(new Error("This browser does not support on-device hair analysis. Try a current Chrome or Edge browser."));
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/hair-segmenter.js");
    const pending = new Map<number, { resolve: (value: HairSegmentationResult) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
    let id = 0, labels: string[] = [], closed = false;
    const initTimer = setTimeout(() => fail(new Error("The hair models took too long to load. Check the model files and retry.")), 45000);
    function close(error = new Error("Hair analysis was cancelled.")) {
      if (closed) return; closed = true; clearTimeout(initTimer); worker.terminate();
      if (activeClient === client) activeClient = null;
      reject(error);
      for (const task of pending.values()) { clearTimeout(task.timer); task.reject(error); }
      pending.clear();
    }
    function fail(error: Error) {
      if (activeClient === client) modelPromise = null;
      close(error);
    }
    async function sendFrame(source: HTMLImageElement | HTMLCanvasElement | ImageBitmap, request: (id: number, image: ImageBitmap) => VisionRequest): Promise<HairSegmentationResult> {
      if (closed) throw new Error("The hair model is closed. Please restart the preview.");
      const image = await createImageBitmap(source);
      if (closed) { image.close(); throw new Error("Hair analysis was cancelled."); }
      return new Promise((resolveResult, rejectResult) => {
        const requestId = ++id;
        const timer = setTimeout(() => { pending.delete(requestId); const error = new Error("Hair analysis timed out. Try a smaller photo and retry."); rejectResult(error); fail(error); }, 45000);
        pending.set(requestId, { resolve: resolveResult, reject: rejectResult, timer });
        try { worker.postMessage(request(requestId, image), [image]); }
        catch (error) { image.close(); clearTimeout(timer); pending.delete(requestId); rejectResult(error); }
      });
    }
    const client: HairSegmenterClient = {
      getLabels: () => [...labels], close,
      segment: (source) => sendFrame(source, (id, image) => ({ type: "segment", id, image })),
    };
    activeClient = client;
    worker.onmessage = (event: MessageEvent<VisionResponse>) => {
      const message = event.data;
      if (message.type === "ready") { clearTimeout(initTimer); labels = message.labels; resolve(client); return; }
      if (message.type === "error" && message.id === null) { fail(new Error(message.message)); return; }
      const task = pending.get(message.id as number);
      if (!task) return;
      pending.delete(message.id as number); clearTimeout(task.timer);
      if (message.type === "error") task.reject(new Error(message.message)); else task.resolve(message.result);
    };
    worker.onerror = () => fail(new Error("The AI worker could not start. Check the local model and WASM files, then retry."));
    try { worker.postMessage({ type: "init", modelPath: HAIR_MODEL_PATH, guardPath: HAIR_GUARD_PATH, wasmPath: VISION_WASM_PATH } satisfies VisionRequest); }
    catch (error) { fail(error instanceof Error ? error : new Error("The AI worker could not start.")); }
  });
}

/** The same photo singleton and cached pipeline serve upload and camera capture. */
export function loadHairSegmenter(): Promise<HairSegmenterClient> {
  if (!modelPromise) {
    const loading = createWorkerClient().catch((error: unknown) => {
      if (modelPromise === loading) modelPromise = null;
      throw error;
    });
    modelPromise = loading;
  }
  return modelPromise;
}
export function disposeHairSegmenter() { modelPromise = null; activeClient?.close(); }
