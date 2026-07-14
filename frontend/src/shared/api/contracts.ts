import { z } from "zod";

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().nullable(),
    requestId: z.string().min(1),
  }),
});

export const healthResponseSchema = z.object({
  data: z.object({ status: z.enum(["ok", "unavailable"]) }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export const loginRequestSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

const authUserSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  createdAt: z.iso.datetime(),
});

export const authSessionResponseSchema = z.object({
  data: z.object({ user: authUserSchema }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const logoutResponseSchema = z.object({
  data: z.object({ success: z.literal(true) }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const createWorkspaceRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["owner", "admin", "editor", "viewer"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const workspaceResponseSchema = z.object({
  data: z.object({ workspace: workspaceSchema }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const workspaceListResponseSchema = z.object({
  data: z.object({ workspaces: z.array(workspaceSchema) }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const createFormRequestSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const renameFormRequestSchema = createFormRequestSchema;

const formSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  archivedAt: z.iso.datetime().nullable(),
});

export const formResponseSchema = z.object({
  data: z.object({ form: formSchema }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const formListResponseSchema = z.object({
  data: z.object({ forms: z.array(formSchema) }),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    requestId: z.string().min(1),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
export type CreateWorkspaceRequest = z.infer<typeof createWorkspaceRequestSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
export type CreateFormRequest = z.infer<typeof createFormRequestSchema>;
export type RenameFormRequest = z.infer<typeof renameFormRequestSchema>;
export type FormListQuery = { page: number; pageSize: number; includeArchived: boolean };
export type FormResponse = z.infer<typeof formResponseSchema>;
export type FormListResponse = z.infer<typeof formListResponseSchema>;
