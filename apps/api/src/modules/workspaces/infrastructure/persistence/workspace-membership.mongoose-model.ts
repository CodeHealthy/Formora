import mongoose, { type Model, type Types } from "mongoose";

import { workspaceRoles, type WorkspaceRole } from "../../domain/workspace-membership.js";

export interface WorkspaceMembershipDocument {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceMembershipSchema = new mongoose.Schema<WorkspaceMembershipDocument>(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Workspace",
    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    role: { type: String, required: true, enum: workspaceRoles },
  },
  { timestamps: true, versionKey: false },
);

workspaceMembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
workspaceMembershipSchema.index({ userId: 1, createdAt: -1 });

export const workspaceMembershipModel =
  (mongoose.models.WorkspaceMembership as
    | Model<WorkspaceMembershipDocument>
    | undefined) ??
  mongoose.model<WorkspaceMembershipDocument>(
    "WorkspaceMembership",
    workspaceMembershipSchema,
    "workspace_memberships",
  );
