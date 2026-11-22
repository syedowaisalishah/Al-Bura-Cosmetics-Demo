import assert from "node:assert/strict";
import { test } from "node:test";
import { demoShades } from "../src/data/shades.ts";
import { filterShades } from "../src/lib/color/shade-filter.ts";

test("all twelve illustrative shades have unique codes and complete validated metadata", () => {
  assert.equal(demoShades.length, 12);
  assert.equal(new Set(demoShades.map((s) => s.code)).size, 12);
  for (const shade of demoShades) {
    assert.equal(shade.illustrative, true);
    for (const field of ["id", "code", "name", "hex", "family", "reflection"] as const) assert.ok(shade[field].length);
    assert.ok(shade.level >= 1 && shade.level <= 10);
  }
});

test("shade search combines words and family without changing the palette or selection data", () => {
  const original = JSON.stringify(demoShades);
  assert.equal(filterShades(demoShades, "  BURGUNDY d5.6 ", "all")[0]?.id, "demo-10");
  assert.equal(filterShades(demoShades, "#B0633D", "copper")[0]?.name, "Warm Copper");
  assert.equal(filterShades(demoShades, "blonde level 9", "ash")[0]?.name, "Ash Blonde");
  assert.equal(filterShades(demoShades, "Burgundy", "gold").length, 0);
  assert.equal(filterShades(demoShades, "", "all").length, 12);
  assert.equal(JSON.stringify(demoShades), original);
});
