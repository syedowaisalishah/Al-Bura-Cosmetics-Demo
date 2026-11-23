import { z } from "zod";

export const guideRequestSchema = z.object({
  shadeId: z.string().max(40), naturalLevel: z.number().int().min(1).max(10),
  hairHistory: z.enum(["virgin", "previously-coloured", "previously-bleached"]),
  greyPercentage: z.enum(["none", "below-50", "above-50"]),
  hairLength: z.enum(["short", "shoulder", "long", "extra-long"]), hairDensity: z.enum(["fine", "medium", "thick"]),
}).strict();
