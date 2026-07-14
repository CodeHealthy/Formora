import type { IdGenerator } from "../../../../../core/identifiers/id-generator.js";
import type { Clock } from "../../../../../core/time/clock.js";
import type { WorkspaceMembership } from "../../../domain/workspace-membership.js";
import type { WorkspaceRepository } from "../../../domain/workspace.repository.js";
import type { Workspace } from "../../../domain/workspace.js";

export interface CreateWorkspaceCommand {
  actorId: string;
  name: string;
}

export interface CreateWorkspaceResult {
  workspace: Workspace;
  membership: WorkspaceMembership;
}

export class CreateWorkspaceHandler {
  public constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(
    command: CreateWorkspaceCommand,
  ): Promise<CreateWorkspaceResult> {
    const now = this.clock.now();
    const workspace: Workspace = {
      id: this.idGenerator.generate(),
      name: command.name.trim(),
      ownerId: command.actorId,
      createdAt: now,
      updatedAt: now,
    };
    const membership: WorkspaceMembership = {
      id: this.idGenerator.generate(),
      workspaceId: workspace.id,
      userId: command.actorId,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    };

    await this.workspaceRepository.createWithOwner(workspace, membership);
    return { workspace, membership };
  }
}
