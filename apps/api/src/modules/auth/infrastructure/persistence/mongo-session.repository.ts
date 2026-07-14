import mongoose from "mongoose";

import type { Session } from "../../domain/session.js";
import type { SessionRepository } from "../../domain/session.repository.js";
import { sessionModel, type SessionDocument } from "./session.mongoose-model.js";

function toDomain(document: SessionDocument): Session {
  return {
    id: document._id.toHexString(),
    userId: document.userId.toHexString(),
    tokenHash: document.tokenHash,
    expiresAt: document.expiresAt,
    createdAt: document.createdAt,
    lastUsedAt: document.lastUsedAt,
  };
}

export class MongoSessionRepository implements SessionRepository {
  public async create(session: Session): Promise<void> {
    await sessionModel.create({
      _id: new mongoose.Types.ObjectId(session.id),
      userId: new mongoose.Types.ObjectId(session.userId),
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    });
  }

  public async deleteByTokenHash(tokenHash: string): Promise<void> {
    await sessionModel.deleteOne({ tokenHash }).exec();
  }

  public async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const document = await sessionModel.findOne({ tokenHash }).exec();
    return document === null ? null : toDomain(document);
  }
}
