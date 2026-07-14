import type {
  WorkspaceRepository,
  WorkspaceWithMembership,
} from "../../../domain/workspace.repository.js";

export class ListWorkspacesHandler {
  public constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  public execute(userId: string): Promise<WorkspaceWithMembership[]> {
    return this.workspaceRepository.listForUser(userId);
  }
}
