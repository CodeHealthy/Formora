import type { Session } from "./session.js";

export interface SessionRepository {
  create(session: Session): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
}
