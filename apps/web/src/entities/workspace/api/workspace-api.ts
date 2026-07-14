import {
  workspaceListResponseSchema,
  workspaceResponseSchema,
  type CreateWorkspaceRequest,
  type WorkspaceListResponse,
  type WorkspaceResponse,
} from "@formora/contracts";

import { getValidated, requestValidated } from "../../../shared/api/api-client";

export function listWorkspaces(): Promise<WorkspaceListResponse> {
  return getValidated("/workspaces", workspaceListResponseSchema);
}

export function getWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
  return getValidated(`/workspaces/${workspaceId}`, workspaceResponseSchema);
}

export function createWorkspace(
  input: CreateWorkspaceRequest,
): Promise<WorkspaceResponse> {
  return requestValidated("/workspaces", workspaceResponseSchema, {
    body: input,
    method: "POST",
  });
}
