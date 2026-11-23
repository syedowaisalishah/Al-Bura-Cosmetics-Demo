import assert from "node:assert/strict";
import { test } from "node:test";
import { analysePhoto } from "../src/web/ai/photo-analysis.ts";
import { calculateGuide } from "../src/api/services/guide-service.ts";
import { POST } from "../src/app/api/guide/calc/route.ts";
import type { HairColorCache } from "../src/web/ai/hair-recolor.ts";

function cache(lightness: number, brightness = 120): HairColorCache {
  const data = new Uint8ClampedArray(160).fill(brightness); for (let i = 3; i < 160; i += 4) data[i] = 255;
  const lab = new Float32Array(120); for (let i = 0; i < 40; i++) lab[i * 3] = lightness;
  return { source: { width: 40, height: 1, data } as ImageData, mask: { width: 40, height: 1, alpha: new Float32Array(40).fill(1), hairPixels: 40 }, indices: Uint32Array.from({ length: 40 }, (_, i) => i), lab, mean: { l: lightness, a: 0, b: 0 }, toneAnchor: lightness };
}
const input = { shadeId: "demo-10", naturalLevel: 4, hairHistory: "virgin", greyPercentage: "none", hairLength: "shoulder", hairDensity: "medium" };

test("photo starting depth uses original masked pixels and distinguishes dark versus light hair", () => {
  const dark = cache(12), light = cache(75);
  const before = dark.lab.slice();
  const a = analysePhoto(dark, "upload"), b = analysePhoto(light, "camera");
  assert.ok(a.estimatedLevel < b.estimatedLevel); assert.equal(a.medianLightness, 12); assert.equal(b.source, "camera");
  assert.deepEqual(dark.lab, before);
  assert.equal(analysePhoto(cache(12, 25), "upload").lighting, "dim");
  // Dark hair itself must not be mistaken for poor photo exposure.
  assert.equal(a.lighting, "normal");
});

test("guide API derives the trusted shade and reacts to profile changes without producing formulas", () => {
  const first = calculateGuide(input), changed = calculateGuide({ ...input, naturalLevel: 8, hairHistory: "previously-coloured", greyPercentage: "above-50", hairLength: "long", hairDensity: "thick" });
  assert.equal(first.status, 200); assert.equal(changed.status, 200);
  if (!first.body.assessment || !changed.body.assessment || !first.body.notes || !changed.body.notes) throw Error("Missing assessment");
  assert.equal(first.body.assessment.liftDifference, 1); assert.equal(changed.body.assessment.liftDifference, -3);
  assert.notEqual(first.body.notes.historyNote, changed.body.notes.historyNote);
  assert.notEqual(first.body.notes.coverageNote, changed.body.notes.coverageNote);
  assert.notEqual(first.body.notes.serviceNote, changed.body.notes.serviceNote);
  assert.equal(first.body.formulationsApproved, false);
  assert.ok(!("formula" in first.body));
});

test("guide API rejects unknown shades, invalid levels and injected chemical fields", () => {
  assert.equal(calculateGuide({ ...input, shadeId: "unavailable" }).status, 404);
  for (const naturalLevel of [0, 11, 2.5, "4"]) assert.equal(calculateGuide({ ...input, naturalLevel }).status, 400);
  assert.equal(calculateGuide({ ...input, developerVolume: 40 }).status, 400);
});

test("HTTP handler validates content type, malformed JSON, size and returns uncached assessments", async () => {
  const request = (body: string, type = "application/json") => new Request("http://localhost/api/guide/calc/", { method: "POST", headers: { "Content-Type": type }, body });
  assert.equal((await POST(request("x", "text/plain"))).status, 415);
  assert.equal((await POST(request("{"))).status, 400);
  assert.equal((await POST(request("x".repeat(8193)))).status, 413);
  const response = await POST(request(JSON.stringify(input)));
  assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).assessment.selectedShade.id, "demo-10");
});
