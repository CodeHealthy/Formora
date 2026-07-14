import type { WorkspaceMembership } from "./workspace-membership.js";
import type { Workspace } from "./workspace.js";

export interface WorkspaceWithMembership {
  workspace: Workspace;
  membership: WorkspaceMembership;
}

export interface WorkspaceRepository {
  createWithOwner(
    workspace: Workspace,
    ownerMembership: WorkspaceMembership,
  ): Promise<void>;
  findById(id: string): Promise<Workspace | null>;
  listForUser(userId: string): Promise<WorkspaceWithMembership[]>;
}
