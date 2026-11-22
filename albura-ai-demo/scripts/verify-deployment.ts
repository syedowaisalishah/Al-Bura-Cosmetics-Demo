/** Check the exact static output Vercel serves, after a successful Next.js build. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_ARTIFACTS, verifyModel } from "./model-artifact.ts";

const project = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(project, "out");
const configuration = JSON.parse(await readFile(join(project, "vercel.json"), "utf8"));
assert.equal(configuration.framework, null, "Use Vercel's Other preset for this static export.");
assert.equal(configuration.outputDirectory, "out", "Vercel must serve the Next.js export directory.");
assert.equal(configuration.buildCommand, "npm run build");

async function asset(path: string) {
  const file = resolve(output, path);
  assert.ok(file.startsWith(output + sep), "Deployment asset must stay inside out/.");
  assert.ok((await stat(file)).isFile(), `Missing exported asset: ${path}`);
  const bytes = await readFile(file);
  assert.ok(bytes.length > 0, `Empty exported asset: ${path}`);
  return bytes;
}

for (const page of ["index.html", "try-on/index.html", "404.html"]) {
  const html = (await asset(page)).toString("utf8");
  assert.match(html, /<html\b/i, `Invalid exported page: ${page}`);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const path = match[1].split(/[?#]/)[0];
    if (path.startsWith("/_next/") || path === "/icon.svg") await asset(path.slice(1));
  }
}

for (const model of MODEL_ARTIFACTS) {
  verifyModel(await asset(`models/${model.name}.tflite`), model);
}
assert.ok((await asset("workers/hair-segmenter.js")).length > 1000, "The bundled AI worker is missing.");

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
console.log(`Deployment output verified: ${files} files; pages, 2 models, worker and ${runtimeFiles.length} matching SDK runtime assets. No private env/source directories.`);
