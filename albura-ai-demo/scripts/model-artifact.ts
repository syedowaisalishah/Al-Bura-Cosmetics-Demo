import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export interface ModelArtifact { name: string; source: string; sha256: string; bytes: number; input: number[]; output: number[]; labels: string[]; file: string }
export const MODEL_ARTIFACTS: ModelArtifact[] = [
  { name: "hair_segmenter", source: "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite", sha256: "2628cf3ce5f695f604cbea2841e00befcaa3624bf80caf3664bef2656d59bf84", bytes: 781618,
    input: [1,512,512,4], output: [1,512,512,2], labels: ["background", "hair"], file: fileURLToPath(new URL("../public/models/hair_segmenter.tflite", import.meta.url)) },
  { name: "selfie_multiclass_256x256", source: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite", sha256: "c6748b1253a99067ef71f7e26ca71096cd449baefa8f101900ea23016507e0e0", bytes: 16371837,
    input: [1,256,256,3], output: [1,256,256,6], labels: ["background", "hair", "body-skin", "face-skin", "clothes", "others"], file: fileURLToPath(new URL("../public/models/selfie_multiclass_256x256.tflite", import.meta.url)) },
];

/** Inspect pinned FlatBuffers and associated labels without inference or extra tooling. */
export function verifyModel(bytes: Buffer, artifact: ModelArtifact) {
  assert.equal(bytes.length, artifact.bytes, "Unexpected model length");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256, "Model SHA-256 mismatch");
  assert.equal(bytes.toString("ascii", 4, 8), "TFL3", "Missing TFLite identifier; response may be HTML");
  const field = (table: number, index: number) => {
    const vtable = table - bytes.readInt32LE(table), offset = 4 + 2 * index;
    return offset < bytes.readUInt16LE(vtable) ? bytes.readUInt16LE(vtable + offset) : 0;
  };
  const vector = (table: number, index: number) => {
    const offset = field(table, index); assert.ok(offset, `Missing FlatBuffer vector ${index}`);
    const address = table + offset, start = address + bytes.readUInt32LE(address);
    return Array.from({ length: bytes.readUInt32LE(start) }, (_, i) => start + 4 + i * 4);
  };
  const dereference = (address: number) => address + bytes.readUInt32LE(address);
  const integers = (table: number, index: number) => vector(table, index).map((p) => bytes.readInt32LE(p));
  const root = bytes.readUInt32LE(0);
  assert.equal(bytes.readUInt32LE(root + field(root, 0)), 3, "Unsupported TFLite schema");
  const subgraph = dereference(vector(root, 2)[0]), tensors = vector(subgraph, 0).map(dereference);
  const inputIds = integers(subgraph, 1), outputIds = integers(subgraph, 2);
  const inputShapes = inputIds.map((index) => integers(tensors[index], 0)), outputShapes = outputIds.map((index) => integers(tensors[index], 0));
  assert.deepEqual(inputShapes, [artifact.input], "Unexpected model input shape");
  assert.deepEqual(outputShapes, [artifact.output], "Unexpected model output shape");
  for (const id of [...inputIds, ...outputIds]) {
    const type = field(tensors[id], 1); assert.equal(type ? bytes.readUInt8(tensors[id] + type) : 0, 0, "Expected float32 tensors");
  }
  const zip = bytes.indexOf(Buffer.from([0x50,0x4b,0x03,0x04])); assert.ok(zip >= 0, "Missing associated model labels");
  assert.equal(bytes.readUInt16LE(zip + 8), 0, "Expected uncompressed packed labels");
  const nameLength = bytes.readUInt16LE(zip + 26), extraLength = bytes.readUInt16LE(zip + 28);
  assert.equal(bytes.toString("utf8", zip + 30, zip + 30 + nameLength), "labels.txt");
  const start = zip + 30 + nameLength + extraLength;
  const labels = bytes.toString("utf8", start, start + bytes.readUInt32LE(zip + 22)).trim().split(/\r?\n/);
  assert.deepEqual(labels, artifact.labels, "Unexpected category semantics");
  return { name: artifact.name, bytes: bytes.length, sha256: artifact.sha256, identifier: "TFL3", schema: 3, type: "float32", inputShapes, outputShapes, labels };
}
