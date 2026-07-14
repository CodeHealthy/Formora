import mongoose from "mongoose";

import type { WorkspaceMembership } from "../../domain/workspace-membership.js";
import type {
  WorkspaceRepository,
  WorkspaceWithMembership,
} from "../../domain/workspace.repository.js";
import type { Workspace } from "../../domain/workspace.js";
import { membershipToDomain } from "./mongo-workspace-membership.repository.js";
import { workspaceMembershipModel } from "./workspace-membership.mongoose-model.js";
import { workspaceModel, type WorkspaceDocument } from "./workspace.mongoose-model.js";

function workspaceToDomain(document: WorkspaceDocument): Workspace {
  return {
    id: document._id.toHexString(),
    name: document.name,
    ownerId: document.ownerId.toHexString(),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export class MongoWorkspaceRepository implements WorkspaceRepository {
  public async createWithOwner(
    workspace: Workspace,
    ownerMembership: WorkspaceMembership,
  ): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await workspaceModel.create(
          [
            {
              _id: new mongoose.Types.ObjectId(workspace.id),
              name: workspace.name,
              ownerId: new mongoose.Types.ObjectId(workspace.ownerId),
              createdAt: workspace.createdAt,
              updatedAt: workspace.updatedAt,
            },
          ],
          { session },
        );
        await workspaceMembershipModel.create(
          [
            {
              _id: new mongoose.Types.ObjectId(ownerMembership.id),
              workspaceId: new mongoose.Types.ObjectId(ownerMembership.workspaceId),
              userId: new mongoose.Types.ObjectId(ownerMembership.userId),
              role: ownerMembership.role,
              createdAt: ownerMembership.createdAt,
              updatedAt: ownerMembership.updatedAt,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
  }

  public async findById(id: string): Promise<Workspace | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const document = await workspaceModel.findById(id).exec();
    return document === null ? null : workspaceToDomain(document);
  }

  public async listForUser(userId: string): Promise<WorkspaceWithMembership[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    const memberships = await workspaceMembershipModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    const workspaceIds = memberships.map((membership) => membership.workspaceId);
    const workspaces = await workspaceModel.find({ _id: { $in: workspaceIds } }).exec();
    const workspaceById = new Map(
      workspaces.map((workspace) => [workspace._id.toHexString(), workspace]),
    );

    return memberships.flatMap((membership) => {
      const workspace = workspaceById.get(membership.workspaceId.toHexString());
      return workspace === undefined
        ? []
        : [{ workspace: workspaceToDomain(workspace), membership: membershipToDomain(membership) }];
    });
  }
}
