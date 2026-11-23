import type { Shade, ShadeFamily } from "@/shared/types/shade";

export function filterShades(shades: readonly Shade[], query: string, family: ShadeFamily | "all"): readonly Shade[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return shades.filter((shade) => {
    if (family !== "all" && shade.family !== family) return false;
    const text = `${shade.code} ${shade.name} ${shade.hex} ${shade.family} level ${shade.level} ${shade.reflection}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
