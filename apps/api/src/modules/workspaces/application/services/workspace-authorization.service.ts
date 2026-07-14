import { ApplicationError } from "../../../../core/errors/application-error.js";
import type { WorkspaceMembership } from "../../domain/workspace-membership.js";
import type { WorkspaceMembershipRepository } from "../../domain/workspace-membership.repository.js";
import {
  roleHasPermission,
  type WorkspacePermission,
} from "../../domain/workspace-permission.js";

export class WorkspaceAuthorizationService {
  public constructor(
    private readonly membershipRepository: WorkspaceMembershipRepository,
  ) {}

  public async getMembership(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMembership> {
    const membership = await this.membershipRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );

    if (membership === null) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You do not have access to this workspace.",
        403,
      );
    }

    return membership;
  }

  public async assertWorkspacePermission(options: {
    userId: string;
    workspaceId: string;
    permission: WorkspacePermission;
  }): Promise<WorkspaceMembership> {
    const membership = await this.getMembership(options.userId, options.workspaceId);

    if (!roleHasPermission(membership.role, options.permission)) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        403,
      );
    }

    return membership;
  }
}
