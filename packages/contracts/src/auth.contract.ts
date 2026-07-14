import { z } from "zod";

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(12).max(128),
});

export const loginRequestSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  createdAt: z.iso.datetime(),
});

export const authSessionResponseSchema = z.object({
  data: z.object({
    user: authUserSchema,
  }),
  meta: z.object({
    requestId: z.string().min(1),
  }),
});

export const logoutResponseSchema = z.object({
  data: z.object({
    success: z.literal(true),
  }),
  meta: z.object({
    requestId: z.string().min(1),
  }),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
