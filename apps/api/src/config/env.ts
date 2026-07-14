import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGIN: z.url(),
  MONGODB_URI: z.string().min(1).startsWith("mongodb"),
  MONGODB_DB_NAME: z
    .string()
    .min(1)
    .max(63)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use only letters, numbers, hyphens, and underscores."),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(values: NodeJS.ProcessEnv): Environment {
  const result = environmentSchema.safeParse(values);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid API environment: ${issues}`);
  }

  return result.data;
}
