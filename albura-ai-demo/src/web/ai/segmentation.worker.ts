import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { createHairSegmenter, createHairGuard } from "@/web/ai/mediapipe";
import { segmentWithModels } from "@/web/ai/hair-segmentation";
import type { VisionRequest, VisionResponse } from "@/web/types/vision-worker";

const scope = globalThis as unknown as { onmessage: ((event: MessageEvent<VisionRequest>) => void) | null; postMessage: (message: VisionResponse, transfer?: Transferable[]) => void };
let model: ImageSegmenter | null = null, guard: ImageSegmenter | null = null;
const reportError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (args.length === 1 && typeof args[0] === "string" && args[0].trim() === "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.") console.info(args[0]);
  else reportError(...args);
};

scope.onmessage = (event) => {
  const request = event.data;
  void (async () => {
    if (request.type === "init") {
      try {
        model = await createHairSegmenter({ modelPath: request.modelPath, wasmPath: request.wasmPath });
        guard = await createHairGuard(request.guardPath, request.wasmPath);
        scope.postMessage({ type: "ready", labels: model.getLabels() });
      } catch (error) {
        scope.postMessage({ type: "error", id: null, message: `The AI hair models could not load. Check the model files and retry. ${error instanceof Error ? error.message : "Unknown model error."}` });
      }
      return;
    }
    try {
      if (!model || !guard) throw new Error("The hair models are not initialized.");
      const result = segmentWithModels(model, guard, request.image);
      scope.postMessage({ type: "result", id: request.id, result }, [result.categoryMask.buffer, result.hairConfidenceMask.buffer]);
    } catch (error) {
      scope.postMessage({ type: "error", id: request.id, message: `Hair analysis failed. ${error instanceof Error ? error.message : "Unknown model error."}` });
    } finally { request.image.close(); }
  })();
};
