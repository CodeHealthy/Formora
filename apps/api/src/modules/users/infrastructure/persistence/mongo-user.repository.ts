import mongoose from "mongoose";

import type { User } from "../../domain/user.js";
import { EmailAlreadyExistsError } from "../../domain/user.errors.js";
import type { UserRepository } from "../../domain/user.repository.js";
import { userModel, type UserDocument } from "./user.mongoose-model.js";

function toDomain(document: UserDocument): User {
  return {
    id: document._id.toHexString(),
    displayName: document.displayName,
    email: document.email,
    emailNormalized: document.emailNormalized,
    passwordHash: document.passwordHash,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11_000
  );
}

export class MongoUserRepository implements UserRepository {
  public async create(user: User): Promise<void> {
    try {
      await userModel.create({
        _id: new mongoose.Types.ObjectId(user.id),
        displayName: user.displayName,
        email: user.email,
        emailNormalized: user.emailNormalized,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new EmailAlreadyExistsError();
      }

      throw error;
    }
  }

  public async findById(id: string): Promise<User | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const document = await userModel.findById(id).exec();
    return document === null ? null : toDomain(document);
  }

  public async findByNormalizedEmail(emailNormalized: string): Promise<User | null> {
    const document = await userModel.findOne({ emailNormalized }).exec();
    return document === null ? null : toDomain(document);
  }
}
