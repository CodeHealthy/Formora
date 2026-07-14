import mongoose from "mongoose";

import type { WorkspaceMembership } from "../../domain/workspace-membership.js";
import type { WorkspaceMembershipRepository } from "../../domain/workspace-membership.repository.js";
import {
  workspaceMembershipModel,
  type WorkspaceMembershipDocument,
} from "./workspace-membership.mongoose-model.js";

export function membershipToDomain(
  document: WorkspaceMembershipDocument,
): WorkspaceMembership {
  return {
    id: document._id.toHexString(),
    workspaceId: document.workspaceId.toHexString(),
    userId: document.userId.toHexString(),
    role: document.role,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export class MongoWorkspaceMembershipRepository
  implements WorkspaceMembershipRepository
{
  public async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembership | null> {
    if (
      !mongoose.Types.ObjectId.isValid(workspaceId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    const document = await workspaceMembershipModel
      .findOne({ workspaceId, userId })
      .exec();

    return document === null ? null : membershipToDomain(document);
  }
}
