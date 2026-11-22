import { readFile } from "node:fs/promises";
import { MODEL_ARTIFACTS, verifyModel } from "./model-artifact.ts";
for (const artifact of MODEL_ARTIFACTS) {
  try { console.log(JSON.stringify(verifyModel(await readFile(artifact.file), artifact), null, 2)); }
  catch (error) {
    console.error(`Model verification failed for ${artifact.name}. Run npm run model:download to restore official files.`);
    console.error(error instanceof Error ? error.message : error); process.exitCode = 1;
  }
}
