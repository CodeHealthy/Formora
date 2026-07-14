import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "admin", "editor", "viewer"]);

export const createWorkspaceRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: workspaceRoleSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const workspaceResponseSchema = z.object({
  data: z.object({
    workspace: workspaceSchema,
  }),
  meta: z.object({
    requestId: z.string().min(1),
  }),
});

export const workspaceListResponseSchema = z.object({
  data: z.object({
    workspaces: z.array(workspaceSchema),
  }),
  meta: z.object({
    requestId: z.string().min(1),
  }),
});

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type CreateWorkspaceRequest = z.infer<typeof createWorkspaceRequestSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
