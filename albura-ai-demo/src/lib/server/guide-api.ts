import { z } from "zod";
import { demoShades } from "@/data/shades";
import { generateTechnicalGuide } from "@/lib/guide/guide-rules";
import { consultationNotes } from "@/lib/guide/consultation";

export const DATA_VERSION = "albura-interview-2026-11-23";
export const guideRequestSchema = z.object({
  shadeId: z.string().max(40), naturalLevel: z.number().int().min(1).max(10),
  hairHistory: z.enum(["virgin", "previously-coloured", "previously-bleached"]),
  greyPercentage: z.enum(["none", "below-50", "above-50"]),
  hairLength: z.enum(["short", "shoulder", "long", "extra-long"]), hairDensity: z.enum(["fine", "medium", "thick"]),
}).strict();
export function calculateGuide(value: unknown) {
  const parsed = guideRequestSchema.safeParse(value);
  if (!parsed.success) return { status: 400, body: { error: "Choose a valid shade and hair profile. Hair levels must be whole numbers from 1 to 10." } };
  const selectedShade = demoShades.find((s) => s.id === parsed.data.shadeId);
  if (!selectedShade) return { status: 404, body: { error: "That demo shade is unavailable." } };
  const input = { ...parsed.data, selectedShade }, assessment = generateTechnicalGuide(input);
  return { status: 200, body: { assessment, notes: consultationNotes(input, assessment), dataVersion: DATA_VERSION, catalogue: "illustrative", formulationsApproved: false } };
}
