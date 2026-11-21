import { copyFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const source = fileURLToPath(new URL("../node_modules/@mediapipe/tasks-vision/wasm/", import.meta.url));
const destination = fileURLToPath(new URL("../public/wasm/", import.meta.url));
await mkdir(destination, { recursive: true });
const files = (await readdir(source)).filter((file) => /\.(js|wasm)$/.test(file));
if (!files.some((file) => file.endsWith(".wasm"))) throw new Error("MediaPipe WASM assets are missing. Run npm ci first.");
await Promise.all(files.map((file) => copyFile(join(source, file), join(destination, file))));
console.log(`Copied ${files.length} matching MediaPipe runtime assets to public/wasm.`);
