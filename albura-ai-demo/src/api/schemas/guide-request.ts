import { z } from "zod";
import type { GuideRequest } from "@/shared/types/guide";

/** Validate untrusted HTTP input; TypeScript alone cannot validate a request at runtime. */
export const guideRequestSchema = z.object({
  shadeId: z.string().max(40),
  naturalLevel: z.number().int().min(1).max(10),
  hairHistory: z.enum(["virgin", "previously-coloured", "previously-bleached"]),
  greyPercentage: z.enum(["none", "below-50", "above-50"]),
  hairLength: z.enum(["short", "shoulder", "long", "extra-long"]),
  hairDensity: z.enum(["fine", "medium", "thick"]),
}).strict() satisfies z.ZodType<GuideRequest>;
