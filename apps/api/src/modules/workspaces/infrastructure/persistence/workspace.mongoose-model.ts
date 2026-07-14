import mongoose, { type Model, type Types } from "mongoose";

export interface WorkspaceDocument {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new mongoose.Schema<WorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);

workspaceSchema.index({ ownerId: 1, updatedAt: -1 });

export const workspaceModel =
  (mongoose.models.Workspace as Model<WorkspaceDocument> | undefined) ??
  mongoose.model<WorkspaceDocument>("Workspace", workspaceSchema, "workspaces");
