import mongoose, { type Model, type Types } from "mongoose";

export interface UserDocument {
  _id: Types.ObjectId;
  displayName: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, maxlength: 254 },
    emailNormalized: { type: String, required: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index({ emailNormalized: 1 }, { unique: true });

export const userModel =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userSchema, "users");
