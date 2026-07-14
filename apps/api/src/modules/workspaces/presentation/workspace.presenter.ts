import type {
  Workspace as WorkspaceDto,
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@formora/contracts";

import type { WorkspaceWithMembership } from "../domain/workspace.repository.js";

function presentWorkspace(item: WorkspaceWithMembership): WorkspaceDto {
  return {
    id: item.workspace.id,
    name: item.workspace.name,
    role: item.membership.role,
    createdAt: item.workspace.createdAt.toISOString(),
    updatedAt: item.workspace.updatedAt.toISOString(),
  };
}

export function presentWorkspaceResponse(
  item: WorkspaceWithMembership,
  requestId: string,
): WorkspaceResponse {
  return {
    data: { workspace: presentWorkspace(item) },
    meta: { requestId },
  };
}

export function presentWorkspaceList(
  items: WorkspaceWithMembership[],
  requestId: string,
): WorkspaceListResponse {
  return {
    data: { workspaces: items.map(presentWorkspace) },
    meta: { requestId },
  };
}
