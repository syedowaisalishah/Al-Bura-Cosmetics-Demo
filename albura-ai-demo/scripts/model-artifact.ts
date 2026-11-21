import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const MODEL_SOURCE = "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite";
export const MODEL_SHA256 = "2628cf3ce5f695f604cbea2841e00befcaa3624bf80caf3664bef2656d59bf84";
export const MODEL_FILE = fileURLToPath(new URL("../public/models/hair_segmenter.tflite", import.meta.url));

/** Inspect the pinned FlatBuffer and its stored ZIP associated labels, without inference. */
export function verifyHairModel(bytes: Buffer) {
  assert.equal(bytes.length, 781618, "Unexpected model length");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), MODEL_SHA256, "Model SHA-256 mismatch");
  assert.equal(bytes.toString("ascii", 4, 8), "TFL3", "Missing TFLite identifier; the response may be HTML");

  const field = (table: number, index: number) => {
    const vtable = table - bytes.readInt32LE(table);
    const offset = 4 + 2 * index;
    return offset < bytes.readUInt16LE(vtable) ? bytes.readUInt16LE(vtable + offset) : 0;
  };
  const vector = (table: number, index: number) => {
    const offset = field(table, index);
    assert.ok(offset, `Missing FlatBuffer vector ${index}`);
    const address = table + offset;
    const start = address + bytes.readUInt32LE(address);
    return Array.from({ length: bytes.readUInt32LE(start) }, (_, i) => start + 4 + i * 4);
  };
  const dereference = (address: number) => address + bytes.readUInt32LE(address);
  const integers = (table: number, index: number) => vector(table, index).map((p) => bytes.readInt32LE(p));
  const root = bytes.readUInt32LE(0);
  assert.equal(bytes.readUInt32LE(root + field(root, 0)), 3, "Unsupported TFLite schema");
  const subgraph = dereference(vector(root, 2)[0]);
  const tensors = vector(subgraph, 0).map(dereference);
  const inputShapes = integers(subgraph, 1).map((index) => integers(tensors[index], 0));
  const outputShapes = integers(subgraph, 2).map((index) => integers(tensors[index], 0));
  assert.deepEqual(inputShapes, [[1, 512, 512, 4]], "Unexpected hair model input shape");
  assert.deepEqual(outputShapes, [[1, 512, 512, 2]], "Unexpected hair model output shape");

  const zip = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  assert.ok(zip >= 0, "Missing packed model labels");
  assert.equal(bytes.readUInt16LE(zip + 8), 0, "Expected stored labels (no ZIP decompressor needed)");
  const nameLength = bytes.readUInt16LE(zip + 26);
  const extraLength = bytes.readUInt16LE(zip + 28);
  assert.equal(bytes.toString("utf8", zip + 30, zip + 30 + nameLength), "labels.txt");
  const labelStart = zip + 30 + nameLength + extraLength;
  const labels = bytes.toString("utf8", labelStart, labelStart + bytes.readUInt32LE(zip + 22)).trim().split(/\r?\n/);
  assert.deepEqual(labels, ["background", "hair"], "Unexpected category semantics");
  return { bytes: bytes.length, sha256: MODEL_SHA256, identifier: "TFL3", schema: 3, inputShapes, outputShapes, labels };
}
