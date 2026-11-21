import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { MODEL_FILE, MODEL_SOURCE, verifyHairModel } from "./model-artifact.ts";

const temporaryFile = `${MODEL_FILE}.download`;
try {
  const response = await fetch(MODEL_SOURCE, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`Official model download returned HTTP ${response.status}`);
  if (response.headers.get("content-type")?.includes("text/html")) throw new Error("Official endpoint returned HTML instead of a model");
  const bytes = Buffer.from(await response.arrayBuffer());
  const report = verifyHairModel(bytes);
  await mkdir(dirname(MODEL_FILE), { recursive: true });
  await writeFile(temporaryFile, bytes);
  await rename(temporaryFile, MODEL_FILE);
  console.log("Official hair model downloaded and verified:", report);
} catch (error) {
  await rm(temporaryFile, { force: true });
  console.error("Could not download a valid official hair model. No placeholder model has been written.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
