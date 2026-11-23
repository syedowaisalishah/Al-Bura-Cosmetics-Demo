/** Verify the full-stack Next.js build and self-hosted browser AI assets. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_ARTIFACTS, verifyModel } from "./model-artifact.ts";

const project = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(project, "public");
const configuration = JSON.parse(await readFile(join(project, "vercel.json"), "utf8"));
assert.equal(configuration.framework, "nextjs", "Vercel must use the Next.js framework for API routes.");
assert.equal(configuration.outputDirectory, ".next", "The full-stack deployment must use .next rather than the old static out directory.");
assert.equal(configuration.buildCommand, "npm run build");

async function asset(path: string) {
  const file = resolve(output, path);
  assert.ok(file.startsWith(output + sep), "Deployment asset must stay inside public/.");
  assert.ok((await stat(file)).isFile(), `Missing exported asset: ${path}`);
  const bytes = await readFile(file);
  assert.ok(bytes.length > 0, `Empty exported asset: ${path}`);
  return bytes;
}

const next = join(project, ".next");
assert.ok((await readFile(join(next, "BUILD_ID"), "utf8")).trim(), "Missing production build ID.");
const routes = JSON.parse(await readFile(join(next, "server/app-paths-manifest.json"), "utf8"));
for (const route of ["/page", "/try-on/page", "/api/shades/route", "/api/guide/calc/route", "/api/health/route"]) {
  assert.ok(routes[route], `Missing route: ${route}`);
  assert.ok((await stat(join(next, "server", routes[route]))).isFile(), `Missing built handler: ${route}`);
}

for (const model of MODEL_ARTIFACTS) {
  verifyModel(await asset(`models/${model.name}.tflite`), model);
}
for (const worker of ["hair-segmenter", "live-hair-segmenter"]) assert.ok((await asset(`workers/${worker}.js`)).length > 1000, `The bundled ${worker} worker is missing.`);

const wasmSource = join(project, "node_modules/@mediapipe/tasks-vision/wasm");
const runtimeFiles = (await readdir(wasmSource)).filter((path) => /\.(js|wasm)$/.test(path));
assert.ok(runtimeFiles.some((path) => path.endsWith(".wasm")), "The installed SDK has no WASM runtime.");
for (const name of runtimeFiles) {
  const actual = await asset(`wasm/${name}`), expected = await readFile(join(wasmSource, name));
  const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  assert.equal(hash(actual), hash(expected), `Exported MediaPipe runtime version mismatch: ${name}`);
  if (name.endsWith(".wasm")) assert.equal(actual.subarray(0, 4).toString("hex"), "0061736d", `Invalid WASM binary: ${name}`);
}

let files = 0;
async function inspect(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.name.startsWith(".env") && !["node_modules", ".git", ".vercel", "tests"].includes(entry.name), `Private/source file found in export: ${relative(output, join(directory, entry.name))}`);
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else { assert.ok(entry.isFile(), "Do not publish symlinks in the static export."); files++; }
  }
}
await inspect(output);
console.log(`Next.js deployment verified: 2 pages, 3 API handlers; ${files} public assets including 2 models, 2 workers and ${runtimeFiles.length} matching SDK runtime files. No private env/source directories in public/.`);
