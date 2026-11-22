import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { createHairSegmenter, createHairGuard } from "@/lib/ai/mediapipe";
import { segmentWithModel } from "@/lib/ai/hair-segmentation";
import { combineHairConfidence, resizeConfidenceMask, skinExclusion } from "@/lib/ai/mask-utils";
import type { VisionRequest, VisionResponse } from "@/types/vision-worker";

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
      const result = segmentWithModel(model, request.image);
      const confirmation = segmentWithModel(guard, request.image);
      const confidence = confirmation.width === result.width && confirmation.height === result.height ? confirmation.hairConfidenceMask
        : resizeConfidenceMask(confirmation.hairConfidenceMask, confirmation.width, confirmation.height, result.width, result.height);
      if (!confirmation.skinConfidenceMask) throw new Error("The safety model returned no skin confidence masks.");
      const skin = resizeConfidenceMask(confirmation.skinConfidenceMask, confirmation.width, confirmation.height, result.width, result.height);
      const excluded = skinExclusion(skin, result.width, result.height);
      result.hairConfidenceMask = combineHairConfidence(result.hairConfidenceMask, confidence, excluded, result.width, result.height);
      for (let i = 0; i < confidence.length; i++) {
        result.categoryMask[i] = result.hairConfidenceMask[i] > 0.5 ? 1 : 0;
      }
      result.processingTimeMs += confirmation.processingTimeMs;
      scope.postMessage({ type: "result", id: request.id, result }, [result.categoryMask.buffer, result.hairConfidenceMask.buffer]);
    } catch (error) {
      scope.postMessage({ type: "error", id: request.id, message: `Hair analysis failed. ${error instanceof Error ? error.message : "Unknown model error."}` });
    } finally { request.image.close(); }
  })();
};
