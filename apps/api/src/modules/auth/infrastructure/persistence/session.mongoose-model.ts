import mongoose, { type Model, type Types } from "mongoose";

export interface SessionDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

const sessionSchema = new mongoose.Schema<SessionDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    lastUsedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, createdAt: -1 });

export const sessionModel =
  (mongoose.models.Session as Model<SessionDocument> | undefined) ??
  mongoose.model<SessionDocument>("Session", sessionSchema, "sessions");
