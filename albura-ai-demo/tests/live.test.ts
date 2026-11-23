import assert from "node:assert/strict";
import { test } from "node:test";
import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { segmentWithModel } from "../src/web/ai/hair-segmentation.ts";
import { liveDimensions, LiveMaskSmoother, LiveQuality } from "../src/web/ai/live-utils.ts";

test("VIDEO extraction copies callback masks before native memory expires and passes milliseconds", () => {
  const probability = new Float32Array([.9, .2]);
  let calls = 0, timestamp = -1;
  const model = { segmentForVideo: (_source: ImageBitmap, ts: number, callback: (result: unknown) => void) => {
    calls++; timestamp = ts;
    callback({ confidenceMasks: [{}, { width: 2, height: 1, getAsFloat32Array: () => probability }] });
    probability.fill(0); // Callback results expire on return; no caller-owned native close.
  } } as unknown as ImageSegmenter;
  const result = segmentWithModel(model, {} as ImageBitmap, 1234.5);
  assert.equal(calls, 1); assert.equal(timestamp, 1234.5);
  assert.ok(result.hairConfidenceMask[0] > .89); assert.equal(result.categoryMask[1], 0);
  assert.throws(() => segmentWithModel(model, {} as ImageBitmap, NaN), /timestamp/);
  assert.equal(calls, 1);
});

test("live downscaling preserves portrait/landscape geometry without enlarging the camera", () => {
  assert.deepEqual(liveDimensions(1280, 960), { width: 640, height: 480 });
  assert.deepEqual(liveDimensions(960, 1280), { width: 360, height: 480 });
  assert.deepEqual(liveDimensions(160, 90), { width: 160, height: 90 });
  assert.deepEqual(liveDimensions(1280, 720, 192), { width: 192, height: 108 });
  assert.throws(() => liveDimensions(0, 720), /dimensions/);
});

test("quality backs off only after sustained slow frames and never oscillates up", () => {
  const quality = new LiveQuality();
  quality.record(200); quality.record(200); quality.record(100); assert.equal(quality.limit, 640);
  for (let i = 0; i < 3; i++) quality.record(200); assert.equal(quality.limit, 480);
  for (let i = 0; i < 3; i++) quality.record(200); assert.equal(quality.limit, 320);
  for (let i = 0; i < 20; i++) quality.record(10); assert.equal(quality.limit, 320);
});

test("live smoothing softens increases but never carries hair across current skin/background support", () => {
  const smoother = new LiveMaskSmoother(), pixels = new Uint8ClampedArray(100 * 4).fill(128);
  const first = new Float32Array(100); first.fill(.6, 0, 60);
  smoother.update({ width: 10, height: 10, alpha: first, hairPixels: 60 }, pixels, 100);
  const next = new Float32Array(100); next.fill(1, 20, 80);
  const result = smoother.update({ width: 10, height: 10, alpha: next, hairPixels: 60 }, pixels, 200);
  assert.equal(result.alpha[0], 0); assert.ok(result.alpha[25] < 1 && result.alpha[25] > .8);
  assert.equal(next[25], 1, "Native current evidence must stay immutable");
  const blank = smoother.update({ width: 10, height: 10, alpha: new Float32Array(100), hairPixels: 0 }, pixels, 300);
  assert.equal(blank.hairPixels, 0); assert.ok(blank.alpha.every((value) => value === 0));
  const returned = smoother.update({ width: 10, height: 10, alpha: next, hairPixels: 60 }, pixels, 400);
  assert.equal(returned.alpha[25], 1, "Returning hair must not blend with a stale empty frame");
});

test("live smoothing resets on scene changes, timestamp gaps and resolution changes", () => {
  const pixels = new Uint8ClampedArray(400).fill(30), alpha = new Float32Array(100); alpha.fill(.5, 0, 60);
  for (const scenario of ["motion", "gap", "size"] as const) {
    const smoother = new LiveMaskSmoother();
    smoother.update({ width: 10, height: 10, alpha, hairPixels: 60 }, pixels, 100);
    const current = new Float32Array(100); current.fill(1, 0, 60);
    const result = smoother.update({ width: scenario === "size" ? 20 : 10, height: scenario === "size" ? 5 : 10, alpha: current, hairPixels: 60 }, scenario === "motion" ? new Uint8ClampedArray(400).fill(200) : pixels, scenario === "gap" ? 2000 : 200);
    assert.equal(result.alpha[25], 1, scenario);
  }
});
