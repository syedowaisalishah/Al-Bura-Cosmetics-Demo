import { readFile } from "node:fs/promises";
import { MODEL_FILE, verifyHairModel } from "./model-artifact.ts";

try {
  console.log(JSON.stringify(verifyHairModel(await readFile(MODEL_FILE)), null, 2));
} catch (error) {
  console.error("Hair model verification failed. Run npm run model:download to restore the official pinned artifact.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
