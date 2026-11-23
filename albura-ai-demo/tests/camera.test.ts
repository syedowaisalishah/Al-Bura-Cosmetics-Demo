import assert from "node:assert/strict";
import { test } from "node:test";
import { cameraErrorMessage, captureVideoPhoto, stopCameraTracks } from "../src/web/lib/camera.ts";
import { segmentWithModel } from "../src/web/ai/hair-segmentation.ts";
import type { ImageSegmenter } from "@mediapipe/tasks-vision";

test("camera errors distinguish permission, missing hardware and device failures", () => {
  assert.match(cameraErrorMessage(new DOMException("denied", "NotAllowedError")), /permission was denied/);
  assert.match(cameraErrorMessage(new DOMException("missing", "NotFoundError")), /No camera/);
  assert.match(cameraErrorMessage(new DOMException("busy", "NotReadableError")), /another app/);
  assert.match(cameraErrorMessage(new DOMException("blocked", "SecurityError")), /localhost or HTTPS/);
  assert.match(cameraErrorMessage(new Error("Real camera error")), /Real camera error/);
});

test("cleanup stops every media track and accepts an absent stream", () => {
  let stopped = 0;
  const stream = { getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }] } as unknown as MediaStream;
  stopCameraTracks(stream); assert.equal(stopped, 2); assert.doesNotThrow(() => stopCameraTracks(null));
});

test("capture refuses a missing or unready video frame before allocating a canvas", async () => {
  for (const source of [{ readyState: 1, videoWidth: 640, videoHeight: 480 }, { readyState: 2, videoWidth: 0, videoHeight: 480 }]) {
    await assert.rejects(captureVideoPhoto(source as HTMLVideoElement, true), /camera is not ready/);
  }
});

test("IMAGE extraction calls segment once and copies masks before the native result closes", () => {
  let calls = 0, closed = 0;
  const probabilities = new Float32Array([.8, .1]);
  const model = {
    segment: () => { calls++; return {
      confidenceMasks: [{}, { width: 2, height: 1, getAsFloat32Array: () => probabilities }],
      close: () => { closed++; probabilities.fill(0); },
    }; },
  } as unknown as ImageSegmenter;
  const result = segmentWithModel(model, {} as ImageBitmap);
  assert.equal(calls, 1); assert.equal(closed, 1);
  assert.ok(result.hairConfidenceMask[0] > .79); assert.equal(result.categoryMask[0], 1);
});

test("malformed native skin mask dimensions fail safely and close the result", () => {
  let closed = false;
  const model = { segment: () => ({
    confidenceMasks: [{}, { width: 2, height: 1, getAsFloat32Array: () => new Float32Array([.8, .9]) },
      { width: 1, height: 1, getAsFloat32Array: () => new Float32Array([.1]) },
      { width: 2, height: 1, getAsFloat32Array: () => new Float32Array([.1, .1]) }],
    close: () => { closed = true; },
  }) } as unknown as ImageSegmenter;
  assert.throws(() => segmentWithModel(model, {} as ImageBitmap), /misaligned/);
  assert.equal(closed, true);
});
