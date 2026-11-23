import { z } from "zod";

export const shadeSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  family: z.enum(["natural", "ash", "gold", "copper", "red", "violet"]),
  hex: z.string().regex(/^#[0-9a-f]{6}$/i),
  level: z.number().int().min(1).max(10),
  reflection: z.string().min(1),
  lab: z.object({ l: z.number().min(0).max(100), a: z.number(), b: z.number() }).optional(),
  illustrative: z.boolean(),
});

export type Shade = z.infer<typeof shadeSchema>;
export type ShadeFamily = Shade["family"];
