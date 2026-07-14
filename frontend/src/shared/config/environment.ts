import { z } from "zod";

const webEnvironmentSchema = z.object({
  VITE_API_BASE_URL: z.url().default("http://localhost:3000/api/v1"),
});

export const webEnvironment = webEnvironmentSchema.parse(import.meta.env);
