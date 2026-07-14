import { z } from "zod";

export const healthStatusSchema = z.enum(["ok", "unavailable"]);

export const healthResponseSchema = z.object({
  data: z.object({
    status: healthStatusSchema,
  }),
  meta: z.object({
    requestId: z.string().min(1),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
