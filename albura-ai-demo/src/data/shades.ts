import { z } from "zod";
import shadeData from "@/data/demo-shades.json";
import { shadeSchema } from "@/types/shade";

const demoShadeSchema = z.array(shadeSchema.extend({ illustrative: z.literal(true) }))
  .length(12)
  .refine((shades) => new Set(shades.map((shade) => shade.id)).size === shades.length, "Shade IDs must be unique")
  .refine((shades) => new Set(shades.map((shade) => shade.code)).size === shades.length, "Shade codes must be unique");

export const demoShades = demoShadeSchema.parse(shadeData);
