import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { MODEL_ARTIFACTS, verifyModel } from "./model-artifact.ts";
for (const artifact of MODEL_ARTIFACTS) {
  const temporaryFile = `${artifact.file}.download`;
  try {
    const response = await fetch(artifact.source, { signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error(`Official model download returned HTTP ${response.status}`);
    if (response.headers.get("content-type")?.includes("text/html")) throw new Error("Endpoint returned HTML instead of a model");
    const bytes = Buffer.from(await response.arrayBuffer()), report = verifyModel(bytes, artifact);
    await mkdir(dirname(artifact.file), { recursive: true }); await writeFile(temporaryFile, bytes); await rename(temporaryFile, artifact.file);
    console.log("Official model downloaded and verified:", report);
  } catch (error) {
    await rm(temporaryFile, { force: true }); console.error(`Could not download ${artifact.name}. No placeholder has been written.`);
    console.error(error instanceof Error ? error.message : error); process.exitCode = 1;
  }
}
