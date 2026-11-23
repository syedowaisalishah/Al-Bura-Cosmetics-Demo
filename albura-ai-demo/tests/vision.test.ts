import assert from "node:assert/strict";
import { test } from "node:test";
import { hexToRgb, labToRgb, rgbToLab } from "../src/web/lib/color/color-utils.ts";
import { combineHairConfidence, combinePhotoHairConfidence, refineHairMask, resizeConfidenceMask, skinExclusion } from "../src/web/ai/mask-utils.ts";
import { prepareHairColor, recolorHair } from "../src/web/ai/hair-recolor.ts";
import { validatePhoto } from "../src/web/ai/photo-utils.ts";
import type { Shade } from "../src/shared/types/shade.ts";

// A data-only ImageData polyfill for pure pixel math; browser inference is tested separately.
class PixelData {
  data: Uint8ClampedArray; width: number; height: number; colorSpace = "srgb";
  constructor(data: Uint8ClampedArray, width: number, height: number) { this.data = data; this.width = width; this.height = height; }
}
globalThis.ImageData = PixelData as unknown as typeof ImageData;
const shade: Shade = { id: "test", code: "TEST", name: "Copper", family: "copper", hex: "#B0633D", level: 6, reflection: "Copper", illustrative: true };

test("CIELAB D65 agrees with reference red and round-trips sRGB primaries", () => {
  const red = rgbToLab({ r: 255, g: 0, b: 0 });
  assert.ok(Math.abs(red.l - 53.24) < 0.02 && Math.abs(red.a - 80.09) < 0.02 && Math.abs(red.b - 67.2) < 0.02);
  for (const hex of ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#b0633d"]) {
    const rgb = hexToRgb(hex), actual = labToRgb(rgbToLab(rgb));
    for (const c of ["r", "g", "b"] as const) assert.ok(Math.abs(actual[c] - rgb[c]) < 0.01, `${hex} ${c}`);
  }
});

test("asymmetric mask resizing aligns pixel centres without axis swaps", () => {
  const result = resizeConfidenceMask(new Float32Array([0, 1]), 2, 1, 4, 2);
  assert.deepEqual(Array.from(result), [0, .25, .75, 1, 0, .25, .75, 1]);
  assert.throws(() => resizeConfidenceMask(new Float32Array(1), 2, 1, 4, 2));
});

test("refinement removes isolated noise, preserves connected hair and never expands onto background", () => {
  const p = new Float32Array(400);
  for (let y = 2; y < 10; y++) for (let x = 3; x < 12; x++) p[y * 20 + x] = .99;
  p[399] = .99;
  const result = refineHairMask({ width: 20, height: 20, hairConfidenceMask: p, categoryMask: new Uint8Array(400), processingTimeMs: 0 }, 20, 20, { featherRadiusPx: 1 });
  assert.equal(result.alpha[399], 0);
  assert.ok(result.alpha[5 * 20 + 6] > .9);
  assert.ok(result.alpha[2 * 20 + 3] > 0 && result.alpha[2 * 20 + 3] < 1);
  for (let i = 0; i < p.length; i++) if (p[i] <= .5) assert.equal(result.alpha[i], 0);
});

test("skin exclusion protects model-predicted skin and its immediate boundary", () => {
  const skin = new Float32Array(25); skin[12] = .7;
  const excluded = skinExclusion(skin, 5, 5);
  assert.equal(excluded[12], 1); assert.equal(excluded[6], 1); assert.equal(excluded[18], 1);
  assert.equal(excluded[0], 0); assert.equal(excluded[24], 0);
  assert.equal(Array.from(excluded).reduce((a, b) => a + b), 9);
});

test("recolouring preserves every non-hair RGBA byte and retains ordered hair texture", async () => {
  const source = new ImageData(new Uint8ClampedArray(40 * 4), 40, 1);
  const alpha = new Float32Array(40);
  for (let i = 0; i < 40; i++) { const v = 10 + i * 5; source.data.set([v, v, v, i === 39 ? 120 : 255], i * 4); if (i > 3 && i < 36) alpha[i] = 1; }
  const original = new Uint8ClampedArray(source.data);
  const cache = await prepareHairColor(source, { width: 40, height: 1, alpha, hairPixels: 32 });
  const output = await recolorHair({ cache, shade });
  let previousL = -1, changed = 0;
  for (let i = 0; i < 40; i++) {
    const p = i * 4;
    if (alpha[i] === 0) assert.deepEqual(output.data.slice(p, p + 4), original.slice(p, p + 4));
    else {
      const l = rgbToLab({ r: output.data[p], g: output.data[p + 1], b: output.data[p + 2] }).l;
      assert.ok(l > previousL, "Hair luminance ordering must survive the colour transformation"); previousL = l;
      if (output.data[p] !== original[p]) changed++;
    }
    assert.equal(output.data[p + 3], original[p + 3]);
  }
  assert.ok(changed > 20);
  assert.deepEqual(source.data, original, "Cached original image must stay immutable");
  assert.deepEqual((await recolorHair({ cache, shade, intensity: 0 })).data, original);
});

test("pixel pipeline rejects no-hair data and respects cancelled renders", async () => {
  const source = new ImageData(new Uint8ClampedArray(40 * 4).fill(128), 40, 1);
  await assert.rejects(prepareHairColor(source, { width: 40, height: 1, alpha: new Float32Array(40), hairPixels: 0 }), /No clear hair/);
  const alpha = new Float32Array(40).fill(1), cache = await prepareHairColor(source, { width: 40, height: 1, alpha, hairPixels: 40 });
  const controller = new AbortController(); controller.abort();
  await assert.rejects(recolorHair({ cache, shade, signal: controller.signal }), { name: "AbortError" });
});

test("upload rejects unsupported, empty, and oversized files", () => {
  assert.throws(() => validatePhoto(new File(["x"], "x.gif", { type: "image/gif" })), /JPG/);
  assert.throws(() => validatePhoto(new File([], "x.png", { type: "image/png" })), /15 MB/);
  assert.throws(() => validatePhoto(new File([new Uint8Array(15 * 1024 * 1024 + 1)], "x.jpg", { type: "image/jpeg" })), /15 MB/);
  assert.doesNotThrow(() => validatePhoto(new File(["image"], "portrait.JPEG", { type: "image/jpeg" })));
});

test("gamut mapping preserves lightness and hue for colours beyond sRGB", async () => {
  const { gamutMapLabToRgb } = await import("../src/web/lib/color/color-utils.ts");
  for (const lab of [{ l: 35, a: 100, b: 70 }, { l: 80, a: -80, b: 90 }, { l: 50, a: 80, b: -100 }]) {
    const rgb = gamutMapLabToRgb(lab), actual = rgbToLab(rgb);
    assert.ok(Math.abs(actual.l - lab.l) < .01, "Fitting colour gamut must preserve lightness");
    const angle = Math.atan2(lab.b, lab.a), actualAngle = Math.atan2(actual.b, actual.a);
    assert.ok(Math.abs(angle - actualAngle) < .01, "Hue must survive gamut fitting");
    assert.ok(Math.hypot(actual.a, actual.b) < Math.hypot(lab.a, lab.b));
    assert.ok(Object.values(rgb).every((c) => c >= 0 && c <= 255));
  }
});

test("brown, burgundy, blonde and copper retain shadow/highlight ordering without neon saturation", async () => {
  const source = new ImageData(new Uint8ClampedArray(100 * 4), 100, 1), alpha = new Float32Array(100).fill(1);
  for (let i = 0; i < 100; i++) { const grey = 8 + i * 2.4; source.data.set([grey, grey, grey, 255], i * 4); }
  const cache = await prepareHairColor(source, { width: 100, height: 1, alpha, hairPixels: 100 });
  for (const hex of ["#765144", "#763747", "#D8C5A4", "#B0633D"]) {
    const output = await recolorHair({ cache, shade: { ...shade, hex } });
    let previous = -1;
    for (let i = 0; i < 100; i++) {
      const lab = rgbToLab({ r: output.data[i * 4], g: output.data[i * 4 + 1], b: output.data[i * 4 + 2] });
      assert.ok(lab.l > previous, `${hex}: Strand contrast must remain ordered`); previous = lab.l;
      assert.ok(Math.hypot(lab.a, lab.b) < 42, `${hex}: Colour must remain bounded`);
      if (i === 0) assert.ok(lab.l < 12, "Deep shadows must stay dark");
      if (i === 99) assert.ok(lab.l > 85 && Math.hypot(lab.a, lab.b) < 10, "Specular highlights should stay bright and mostly neutral");
    }
  }
});

test("colour cache processes active hair only and always recolours from the immutable original", async () => {
  const source = new ImageData(new Uint8ClampedArray(80 * 4).fill(100), 80, 1), alpha = new Float32Array(80);
  alpha.fill(1, 20, 60);
  const cache = await prepareHairColor(source, { width: 80, height: 1, alpha, hairPixels: 40 });
  assert.equal(cache.indices.length, 40); assert.equal(cache.lab.length, 120);
  const first = await recolorHair({ cache, shade });
  await recolorHair({ cache, shade: { ...shade, hex: "#763747" } });
  assert.deepEqual((await recolorHair({ cache, shade })).data, first.data);
  assert.ok(source.data.every((v) => v === 100));
});

test("shadow-heavy hair does not force a dark target to brighten diffuse strands excessively", async () => {
  const source = new ImageData(new Uint8ClampedArray(100 * 4), 100, 1), alpha = new Float32Array(100).fill(1);
  for (let i = 0; i < 100; i++) { const grey = i < 75 ? 15 : 100; source.data.set([grey, grey, grey, 255], i * 4); }
  const cache = await prepareHairColor(source, { width: 100, height: 1, alpha, hairPixels: 100 });
  const out = await recolorHair({ cache, shade: { ...shade, hex: "#763747" } });
  const original = rgbToLab({ r: 100, g: 100, b: 100 }).l;
  const rendered = rgbToLab({ r: out.data[99 * 4], g: out.data[99 * 4 + 1], b: out.data[99 * 4 + 2] }).l;
  assert.ok(rendered <= original + 3, "A dark burgundy should not turn diffuse strands into bright pink because the rest of the hair is shadowed");
});


test("connected highlighted strands survive disagreement without admitting unsupported background", () => {
  const width = 14, height = 8, primary = new Float32Array(width * height), guard = new Float32Array(width * height), excluded = new Uint8Array(width * height);
  for (let y = 2; y <= 5; y++) for (let x = 2; x <= 5; x++) { primary[y * width + x] = .95; guard[y * width + x] = .9; }
  // Both models support a strand, but the multiclass model is uncertain at its golden tips.
  for (let x = 6; x <= 9; x++) { primary[3 * width + x] = .94; guard[3 * width + x] = .36; }
  // A hair-only false positive right next to the same seed is rejected by the guard.
  primary[2 * width + 6] = .99; guard[2 * width + 6] = .02;
  // An uncertain detached speck has no connection to reliable hair.
  primary[6 * width + 12] = .96; guard[6 * width + 12] = .35;
  const output = combineHairConfidence(primary, guard, excluded, width, height);
  assert.ok(output[3 * width + 9] > .9, "Connected tips retain the confident model's evidence");
  assert.ok(output[2 * width + 6] < .1, "Unsupported background must remain excluded");
  assert.ok(output[6 * width + 12] < .6, "Detached weak evidence must not become foreground");
  assert.ok(guard[3 * width + 9] < .4, "Native evidence is never mutated");
});

test("skin exclusion blocks strand recovery and cannot be crossed to reach uncertain regions", () => {
  const primary = new Float32Array([.95, .95, .95, .95, .95]);
  const guard = new Float32Array([.9, .4, .4, .4, .4]);
  const output = combineHairConfidence(primary, guard, new Uint8Array([0, 0, 1, 0, 0]), 5, 1);
  assert.ok(output[1] > .9); assert.equal(output[2], 0);
  assert.ok(output[3] < .6 && output[4] < .6, "Recovery cannot jump across protected skin");
  assert.throws(() => combineHairConfidence(primary, new Float32Array(1), new Uint8Array(5), 5, 1), /dimensions/);
});

test("photo recovery closes thin AI-confirmed highlight gaps without propagating through unsupported pixels", () => {
  const width = 19, height = 13, primary = new Float32Array(width * height), guard = new Float32Array(primary.length), skin = new Float32Array(primary.length);
  for (let y = 3; y <= 9; y++) for (let x = 4; x <= 14; x++) { primary[y * width + x] = .95; guard[y * width + x] = .9; }
  // A highlighted strand is recognized strongly by multiclass, but rejected by hair-only.
  for (let x = 6; x <= 12; x++) { primary[6 * width + x] = .02; guard[6 * width + x] = .84; }
  // Unsupported background, a distant guard false-positive and a broad ambiguous patch.
  primary[5 * width + 3] = .99; guard[5 * width + 3] = .02;
  guard[0] = .99;
  for (let y = 0; y <= 1; y++) for (let x = 7; x <= 11; x++) guard[y * width + x] = .8;
  const originalPrimary = primary.slice(), originalGuard = guard.slice();
  const result = combinePhotoHairConfidence(primary, guard, skin, width, height);
  for (let x = 6; x <= 12; x++) assert.ok(result[6 * width + x] > .83);
  assert.ok(result[5 * width + 3] < .03); assert.equal(result[0], 0);
  for (let y = 0; y <= 1; y++) for (let x = 7; x <= 11; x++) assert.equal(result[y * width + x], 0);
  assert.deepEqual(primary, originalPrimary); assert.deepEqual(guard, originalGuard);
});

test("photo recovery preserves native skin and releases only a strongly confirmed hair pixel in its dilation border", () => {
  const width = 11, height = 9, primary = new Float32Array(width * height), guard = new Float32Array(primary.length), skin = new Float32Array(primary.length);
  primary.fill(.95); guard.fill(.9);
  const centre = 4 * width + 5; skin[centre] = .8;
  skin[centre + 2] = .2; // Even strong hair evidence cannot override native skin.
  const result = combinePhotoHairConfidence(primary, guard, skin, width, height);
  assert.equal(result[centre], 0); assert.equal(result[centre + 2], 0);
  assert.ok(result[centre - 1] > .9, "Skin dilation must not erase strongly confirmed adjacent hair");
  const matte = refineHairMask({ width, height, categoryMask: new Uint8Array(primary.length), hairConfidenceMask: result, processingTimeMs: 0 }, width, height);
  assert.equal(matte.alpha[centre], 0); assert.equal(matte.alpha[centre + 2], 0);
});

test("photo recovery uses an immutable seed mask, so high-confidence guard edges cannot grow repeatedly", () => {
  const width = 15, height = 7, primary = new Float32Array(width * height), guard = new Float32Array(primary.length), skin = new Float32Array(primary.length);
  for (let y = 2; y <= 4; y++) for (let x = 5; x <= 7; x++) { primary[y * width + x] = .95; guard[y * width + x] = .9; }
  for (let x = 8; x <= 14; x++) guard[3 * width + x] = .9;
  const result = combinePhotoHairConfidence(primary, guard, skin, width, height);
  assert.ok(result[3 * width + 8] > .89);
  for (let x = 9; x <= 14; x++) assert.equal(result[3 * width + x], 0);
  assert.throws(() => combinePhotoHairConfidence(primary, guard.subarray(1), skin, width, height), /dimensions/);
});

test("photo gap recovery cannot look across a native skin barrier to find supporting hair", () => {
  const width = 384, height = 9, primary = new Float32Array(width * height), guard = new Float32Array(primary.length), skin = new Float32Array(primary.length);
  for (const x of [9, 15]) { primary[4 * width + x] = .95; guard[4 * width + x] = .9; }
  const gap = 4 * width + 12; primary[gap] = .02; guard[gap] = .82;
  assert.ok(combinePhotoHairConfidence(primary, guard, skin, width, height)[gap] > .81);
  skin[4 * width + 10] = .8;
  assert.ok(combinePhotoHairConfidence(primary, guard, skin, width, height)[gap] < .03);
});

test("reused colour buffers retain default photo maths without modifying original or excluded pixels", async () => {
  const source = new ImageData(new Uint8ClampedArray(400), 100, 1), alpha = new Float32Array(100);
  for (let i = 0; i < 100; i++) { source.data.set([20 + i * 2, 15 + i, 12 + i, 255], i * 4); if (i >= 10 && i < 90) alpha[i] = .9; }
  const original = new Uint8ClampedArray(source.data), mask = { width: 100, height: 1, alpha, hairPixels: 80 };
  const cache = await prepareHairColor(source, mask);
  const indices = new Uint32Array(120), lab = new Float32Array(360);
  const live = await prepareHairColor(source, mask, undefined, { indices, lab, yieldToBrowser: false });
  assert.equal(live.indices.buffer, indices.buffer); assert.equal(live.lab.buffer, lab.buffer);
  const output = new ImageData(new Uint8ClampedArray(400).fill(255), 100, 1);
  for (const hex of ["#763747", "#B0633D", "#D8C5A4"]) {
    const target = { ...shade, hex };
    assert.equal(await recolorHair({ cache: live, shade: target, output, yieldToBrowser: false }), output);
    assert.deepEqual(output.data, (await recolorHair({ cache, shade: target })).data);
  }
  assert.deepEqual(source.data, original);
  await assert.rejects(recolorHair({ cache, shade, output: source }), /must not alias/);
});

test("live blonde limits lightening of dim hair while retaining shadow and strand contrast", async () => {
  const source = new ImageData(new Uint8ClampedArray(200 * 4), 200, 1), alpha = new Float32Array(200);
  for (let i = 0; i < 200; i++) {
    const v = 8 + i * .55;
    source.data.set([v, v + 2, v, 255], i * 4);
    if (i >= 10 && i < 190) alpha[i] = 1;
  }
  const original = new Uint8ClampedArray(source.data);
  const cache = await prepareHairColor(source, { width: 200, height: 1, alpha, hairPixels: 180 });
  const blonde = { ...shade, hex: "#D8C5A4" };
  const output = await recolorHair({ cache, shade: blonde, intensity: 1, profile: "live" });
  const photo = await recolorHair({ cache, shade: blonde, intensity: 1 });
  let previous = -1, changed = 0;
  const lights = (data: Uint8ClampedArray, i: number) => rgbToLab({ r: data[i * 4], g: data[i * 4 + 1], b: data[i * 4 + 2] }).l;
  for (let i = 0; i < 200; i++) {
    const l = lights(output.data, i), before = lights(source.data, i);
    if (alpha[i] === 0) assert.deepEqual(output.data.slice(i * 4, i * 4 + 4), original.slice(i * 4, i * 4 + 4));
    else {
      assert.ok(l - before < 10.6, "Live lightening must stay bounded even at maximum strength");
      assert.ok(l >= previous - .15, "Strand lightness ordering must survive rounding"); previous = l;
      if (output.data[i * 4] !== original[i * 4]) changed++;
    }
  }
  assert.ok(changed > 100, "A visible tint remains, rather than silently disabling recolouring");
  assert.ok(lights(output.data, 180) - lights(output.data, 20) >= (lights(source.data, 180) - lights(source.data, 20)) * .85, "Hair contrast must not flatten into a uniform patch");
  assert.ok(lights(photo.data, 160) > lights(output.data, 160) + 5, "Still-photo appearance keeps its existing stronger transform");
  assert.deepEqual(source.data, original);
  assert.deepEqual((await recolorHair({ cache, shade: blonde, profile: "live", intensity: 0 })).data, original);
});

test("live colour strength is source-relative and changes tint without accumulating colour", async () => {
  const source = new ImageData(new Uint8ClampedArray(160), 40, 1), alpha = new Float32Array(40).fill(1);
  for (let i = 0; i < 40; i++) source.data.set([40 + i, 43 + i, 39 + i, 255], i * 4);
  const cache = await prepareHairColor(source, { width: 40, height: 1, alpha, hairPixels: 40 });
  const copper = { ...shade, hex: "#B0633D" };
  const full = await recolorHair({ cache, shade: copper, profile: "live", intensity: 1 });
  const half = await recolorHair({ cache, shade: copper, profile: "live", intensity: .5 });
  for (let i = 0; i < source.data.length; i++) assert.ok(Math.abs(half.data[i] - (source.data[i] + full.data[i]) / 2) <= 1);
  await recolorHair({ cache, shade: { ...shade, hex: "#763747" }, profile: "live" });
  assert.deepEqual((await recolorHair({ cache, shade: copper, profile: "live", intensity: 1 })).data, full.data);
});
