import { guideRequestSchema } from "@/api/schemas/guide-request";
import { DATA_VERSION } from "@/shared/data/version";
import { demoShades } from "@/shared/data/shades";
import { generateTechnicalGuide } from "@/shared/guide/guide-rules";
import { consultationNotes } from "@/shared/guide/consultation";

export function calculateGuide(value: unknown) {
  const parsed = guideRequestSchema.safeParse(value);
  if (!parsed.success) return { status: 400, body: { error: "Choose a valid shade and hair profile. Hair levels must be whole numbers from 1 to 10." } };
  const selectedShade = demoShades.find((s) => s.id === parsed.data.shadeId);
  if (!selectedShade) return { status: 404, body: { error: "That demo shade is unavailable." } };
  const input = { ...parsed.data, selectedShade }, assessment = generateTechnicalGuide(input);
  return { status: 200, body: { assessment, notes: consultationNotes(input, assessment), dataVersion: DATA_VERSION, catalogue: "illustrative", formulationsApproved: false } };
}
