import assert from "node:assert/strict";
import { test } from "node:test";
import { generateTechnicalGuide } from "../src/lib/guide/guide-rules.ts";
import { HAIR_LEVELS, formatLift, reflectionNotation } from "../src/lib/guide/guide-reference.ts";
import { demoShades } from "../src/data/shades.ts";
import type { GuideInput, HairHistory } from "../src/types/guide.ts";

const input = (naturalLevel: number, targetLevel: number, hairHistory: HairHistory = "virgin"): GuideInput => ({
  naturalLevel, selectedShade: { ...demoShades[0], level: targetLevel }, hairHistory,
  greyPercentage: "none", hairLength: "shoulder", hairDensity: "medium",
});

for (const scenario of [
  { name: "A: moderate lift", natural: 4, target: 5, lift: 1, classification: "Moderate lift assessment" },
  { name: "B: deposit/darken", natural: 7, target: 5, lift: -2, classification: "Deposit/darken assessment" },
  { name: "C: multi-session", natural: 2, target: 9, lift: 7, classification: "Multi-session professional assessment" },
  { name: "no level change", natural: 5, target: 5, lift: 0, classification: "Deposit/darken assessment" },
  { name: "upper moderate boundary", natural: 4, target: 6, lift: 2, classification: "Moderate lift assessment" },
  { name: "lower significant boundary", natural: 3, target: 6, lift: 3, classification: "Significant lift assessment; professional review" },
  { name: "upper significant boundary", natural: 2, target: 6, lift: 4, classification: "Significant lift assessment; professional review" },
  { name: "pre-lightening boundary", natural: 2, target: 7, lift: 5, classification: "Pre-lightening assessment required" },
  { name: "upper pre-lightening boundary", natural: 2, target: 8, lift: 6, classification: "Pre-lightening assessment required" },
]) {
  test(scenario.name, () => {
    const result = generateTechnicalGuide(input(scenario.natural, scenario.target));
    assert.equal(result.liftDifference, scenario.lift); assert.equal(result.classification, scenario.classification);
    assert.equal(result.approvalStatus, "demo_unapproved");
  });
}

test("D: previously bleached positive lift overrides every lift classification", () => {
  for (const target of [5, 6, 7, 8, 9, 10]) {
    assert.equal(generateTechnicalGuide(input(3, target, "previously-bleached")).classification, "Professional consultation required");
  }
  const deposit = generateTechnicalGuide(input(7, 5, "previously-bleached"));
  assert.equal(deposit.classification, "Deposit/darken assessment");
  assert.ok(deposit.warnings.some((warning) => warning.includes("Previously bleached")));
});

test("E: the selected JSON shade determines target, reflection and result without mutation", () => {
  const initial = input(4, 5), snapshot = structuredClone(initial);
  const shade = demoShades.find((item) => item.name === "Ash Blonde")!;
  const result = generateTechnicalGuide({ ...initial, selectedShade: shade });
  assert.equal(result.selectedShade, shade); assert.equal(result.targetLevel, shade.level);
  assert.equal(result.reflection, shade.reflection); assert.equal(result.liftDifference, shade.level - 4);
  assert.deepEqual(initial, snapshot);
});

test("F: manual natural-level changes recalculate deterministically", () => {
  const original = input(4, 5), changed = { ...original, naturalLevel: 7 };
  assert.equal(generateTechnicalGuide(original).classification, "Moderate lift assessment");
  assert.equal(generateTechnicalGuide(changed).classification, "Deposit/darken assessment");
  assert.deepEqual(generateTechnicalGuide(changed), generateTechnicalGuide(changed));
});

test("history and grey warnings change without calculating quantities for length/density", () => {
  const virgin = generateTechnicalGuide(input(4, 5));
  const coloured = generateTechnicalGuide(input(4, 5, "previously-coloured"));
  assert.ok(coloured.warnings.length > virgin.warnings.length);
  const grey = generateTechnicalGuide({ ...input(4, 5), greyPercentage: "above-50", hairLength: "extra-long", hairDensity: "thick" });
  assert.ok(grey.warnings.some((warning) => warning.includes("grey-coverage formula")));
  assert.equal(grey.classification, virgin.classification);
});

test("all 300 valid level/history combinations remain unapproved and contain no treatment output fields", () => {
  const expectedKeys = ["approvalStatus", "classification", "liftDifference", "naturalLevel", "reflection", "selectedShade", "targetLevel", "warnings"].sort();
  for (let natural = 1; natural <= 10; natural++) for (let target = 1; target <= 10; target++) {
    for (const history of ["virgin", "previously-coloured", "previously-bleached"] as const) {
      const result = generateTechnicalGuide(input(natural, target, history));
      assert.equal(result.approvalStatus, "demo_unapproved");
      assert.equal(result.liftDifference, target - natural);
      assert.deepEqual(Object.keys(result).sort(), expectedKeys);
      assert.ok(result.warnings.length >= 6);
    }
  }
});

test("invalid numeric levels and unrecognized manual input categories are rejected", () => {
  for (const invalid of [0, 11, 2.5, NaN, Infinity]) {
    assert.throws(() => generateTechnicalGuide(input(invalid, 5)), /1 to 10/);
    assert.throws(() => generateTechnicalGuide(input(4, invalid)), /1 to 10/);
  }
  assert.throws(() => generateTechnicalGuide({ ...input(4, 5), hairHistory: "unknown" } as unknown as GuideInput), /valid manual/);
});

test("reference pigments and reflection notation match the supplied demonstration values", () => {
  assert.deepEqual(HAIR_LEVELS.map((level) => level.pigment), ["Red", "Red", "Red-brown", "Red-orange", "Orange", "Orange-gold", "Gold", "Yellow", "Pale yellow", "Palest yellow"]);
  assert.equal(reflectionNotation(demoShades[8]), "Copper (.4)");
  assert.equal(formatLift(1), "+1"); assert.equal(formatLift(-2), "-2"); assert.equal(formatLift(0), "0");
});
