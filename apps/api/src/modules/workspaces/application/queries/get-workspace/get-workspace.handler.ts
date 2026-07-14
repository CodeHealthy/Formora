import { ApplicationError } from "../../../../../core/errors/application-error.js";
import type { WorkspaceWithMembership } from "../../../domain/workspace.repository.js";
import type { WorkspaceRepository } from "../../../domain/workspace.repository.js";
import type { WorkspaceAuthorizationService } from "../../services/workspace-authorization.service.js";

export class GetWorkspaceHandler {
  public constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly authorizationService: WorkspaceAuthorizationService,
  ) {}

  public async execute(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceWithMembership> {
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (workspace === null) {
      throw new ApplicationError(
        "WORKSPACE_NOT_FOUND",
        "The requested workspace was not found.",
        404,
      );
    }

    const membership = await this.authorizationService.getMembership(userId, workspaceId);
    return { workspace, membership };
  }
}
