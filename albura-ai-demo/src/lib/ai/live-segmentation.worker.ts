import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { createHairSegmenter, createHairGuard } from "@/lib/ai/mediapipe";
import { segmentWithModels } from "@/lib/ai/hair-segmentation";
import { refineHairMask } from "@/lib/ai/mask-utils";
import { prepareHairColor, recolorHair, type HairColorWorkspace } from "@/lib/ai/hair-recolor";
import { LiveColorSmoother, LiveMaskSmoother } from "@/lib/ai/live-utils";
import type { LiveRequest, LiveResponse } from "@/types/live-camera";

const scope = globalThis as unknown as { onmessage: (event: MessageEvent<LiveRequest>) => void; postMessage: (message: LiveResponse, transfer?: Transferable[]) => void };
let model: ImageSegmenter | null = null, guard: ImageSegmenter | null = null;
let busy = false, lastTimestamp = -1;
let canvas: OffscreenCanvas | null = null, context: OffscreenCanvasRenderingContext2D | null = null, output: ImageData | undefined;
const workspace: HairColorWorkspace = { yieldToBrowser: false }, temporal = new LiveMaskSmoother(), color = new LiveColorSmoother();
const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (args.length === 1 && typeof args[0] === "string" && args[0].trim() === "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.") console.info(args[0]);
  else originalError(...args);
};
scope.onmessage = ({ data: request }) => {
  void (async () => {
    if (request.type === "init") {
      try {
        if (typeof OffscreenCanvas === "undefined") throw new Error("Offscreen live processing is unavailable. Use Take Photo.");
        const gpu = request.delegate === "GPU";
        if (gpu) {
          const gl = new OffscreenCanvas(1, 1).getContext("webgl2");
          if (!gl) throw new Error("GPU WebGL2 processing is unavailable.");
          const debug = gl.getExtension("WEBGL_debug_renderer_info");
          const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
          gl.getExtension("WEBGL_lose_context")?.loseContext();
          if (!request.allowSoftwareGpu && /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(renderer)) throw new Error("Software-rendered GPU detected. CPU processing is preferred.");
        }
        const options = { runningMode: "VIDEO" as const, delegate: request.delegate };
        model = await createHairSegmenter({ modelPath: request.modelPath, wasmPath: request.wasmPath, ...options, ...(gpu ? { canvas: new OffscreenCanvas(1, 1) } : {}) });
        guard = await createHairGuard(request.guardPath, request.wasmPath, { ...options, ...(gpu ? { canvas: new OffscreenCanvas(1, 1) } : {}) });
        scope.postMessage({ type: "ready", delegate: request.delegate });
      } catch (cause) {
        model?.close(); guard?.close(); model = null; guard = null;
        scope.postMessage({ type: "error", id: null, message: cause instanceof Error ? cause.message : "Live models could not load." });
      }
      return;
    }
    if (busy) { request.image.close(); scope.postMessage({ type: "error", id: request.id, message: "A live frame is already processing." }); return; }
    busy = true;
    try {
      if (!model || !guard) throw new Error("Live models are not initialized.");
      if (!Number.isFinite(request.timestampMs) || request.timestampMs <= lastTimestamp) throw new Error("Live timestamps must strictly increase in milliseconds.");
      lastTimestamp = request.timestampMs;
      const started = performance.now(), segmentation = segmentWithModels(model, guard, request.image, request.timestampMs);
      const inferenceMs = performance.now() - started;
      const { width, height } = request.image;
      if (!canvas || canvas.width !== width || canvas.height !== height) {
        canvas = new OffscreenCanvas(width, height); context = canvas.getContext("2d", { willReadFrequently: true });
        output = undefined; workspace.indices = undefined; workspace.lab = undefined; temporal.reset(); color.reset();
      }
      if (!context || !canvas) throw new Error("Live Canvas 2D is unavailable.");
      context.drawImage(request.image, 0, 0);
      const source = context.getImageData(0, 0, width, height), maskStart = performance.now();
      const mask = temporal.update(refineHairMask(segmentation, width, height), source.data, request.timestampMs);
      const maskMs = performance.now() - maskStart, colorStart = performance.now();
      if (mask.hairPixels > 0) {
        const cache = await prepareHairColor(source, mask, undefined, workspace);
        workspace.indices = cache.indices; workspace.lab = cache.lab;
        color.update(cache);
        output = await recolorHair({ cache, shade: request.shade, output, yieldToBrowser: false });
        context.putImageData(output, 0, 0);
      } else color.reset();
      const recolorMs = performance.now() - colorStart, frame = canvas.transferToImageBitmap();
      scope.postMessage({ type: "frame", id: request.id, result: {
        frame, width, height, hairPixels: mask.hairPixels, shadeId: request.shade.id, timestampMs: request.timestampMs,
        inferenceMs, maskMs, recolorMs, totalMs: performance.now() - started,
      } }, [frame]);
    } catch (cause) {
      scope.postMessage({ type: "error", id: request.id, message: cause instanceof Error ? cause.message : "Live frame processing failed." });
    } finally { request.image.close(); busy = false; }
  })();
};
