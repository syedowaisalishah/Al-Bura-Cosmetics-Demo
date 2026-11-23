import { copyFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { build } from "esbuild";

const source = fileURLToPath(new URL("../node_modules/@mediapipe/tasks-vision/wasm/", import.meta.url));
const destination = fileURLToPath(new URL("../public/wasm/", import.meta.url));
await mkdir(destination, { recursive: true });
const files = (await readdir(source)).filter((file) => /\.(js|wasm)$/.test(file));
if (!files.some((file) => file.endsWith(".wasm"))) throw new Error("MediaPipe WASM assets are missing. Run npm ci first.");
await Promise.all(files.map((file) => copyFile(join(source, file), join(destination, file))));
console.log(`Copied ${files.length} matching MediaPipe runtime assets to public/wasm.`);

const project = fileURLToPath(new URL("../", import.meta.url));
await build({
  absWorkingDir: project,
  entryPoints: { "hair-segmenter": "src/lib/ai/segmentation.worker.ts", "live-hair-segmenter": "src/lib/ai/live-segmentation.worker.ts" },
  outdir: "public/workers", bundle: true,
  format: "iife", platform: "browser", target: "es2020", minify: true,
  // Runtime model paths are passed in the worker's initialization message.
  define: { "process.env.NEXT_PUBLIC_HAIR_MODEL_PATH": "undefined", "process.env.NEXT_PUBLIC_VISION_WASM_PATH": "undefined", "process.env.NEXT_PUBLIC_HAIR_GUARD_MODEL_PATH": "undefined" },
});
console.log("Built the separate IMAGE and VIDEO segmentation workers.");
