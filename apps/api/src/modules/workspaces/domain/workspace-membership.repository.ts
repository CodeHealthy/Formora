import type { WorkspaceMembership } from "./workspace-membership.js";

export interface WorkspaceMembershipRepository {
  findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembership | null>;
}
