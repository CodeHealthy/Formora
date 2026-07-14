import { describe, expect, it } from "vitest";

import type { IdGenerator } from "../../../../../core/identifiers/id-generator.js";
import type { Clock } from "../../../../../core/time/clock.js";
import type { User } from "../../../../users/domain/user.js";
import type { UserRepository } from "../../../../users/domain/user.repository.js";
import type { Session } from "../../../domain/session.js";
import type { SessionRepository } from "../../../domain/session.repository.js";
import type { PasswordHasher } from "../../ports/password-hasher.js";
import type { SessionTokenService } from "../../ports/session-token-service.js";
import { SessionIssuer } from "../../services/session-issuer.js";
import { RegisterHandler } from "./register.handler.js";

class InMemoryUserRepository implements UserRepository {
  public readonly users: User[] = [];

  public create(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }

  public findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }

  public findByNormalizedEmail(emailNormalized: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.emailNormalized === emailNormalized) ?? null,
    );
  }
}

class InMemorySessionRepository implements SessionRepository {
  public readonly sessions: Session[] = [];

  public create(session: Session): Promise<void> {
    this.sessions.push(session);
    return Promise.resolve();
  }

  public deleteByTokenHash(tokenHash: string): Promise<void> {
    const index = this.sessions.findIndex((session) => session.tokenHash === tokenHash);
    if (index >= 0) {
      this.sessions.splice(index, 1);
    }
    return Promise.resolve();
  }

  public findByTokenHash(tokenHash: string): Promise<Session | null> {
    return Promise.resolve(
      this.sessions.find((session) => session.tokenHash === tokenHash) ?? null,
    );
  }
}

const clock: Clock = { now: () => new Date("2026-07-14T12:00:00.000Z") };
let id = 0;
const idGenerator: IdGenerator = {
  generate: () => `00000000000000000000000${String(++id)}`.slice(-24),
};
const passwordHasher: PasswordHasher = {
  hash: (password) => Promise.resolve(`hashed:${password}`),
  verify: (password, hash) => Promise.resolve(hash === `hashed:${password}`),
};
const tokenService: SessionTokenService = {
  generate: () => ({ rawToken: "raw-token", tokenHash: "token-hash" }),
  hash: () => "token-hash",
};

describe("RegisterHandler", () => {
  it("creates a normalized user and a session", async () => {
    id = 0;
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionRepository();
    const handler = new RegisterHandler(
      users,
      passwordHasher,
      new SessionIssuer(sessions, tokenService, idGenerator, clock, 60_000),
      idGenerator,
      clock,
    );

    const result = await handler.execute({
      displayName: " Ada Lovelace ",
      email: " ADA@Example.com ",
      password: "a-secure-password",
    });

    expect(result.user.emailNormalized).toBe("ada@example.com");
    expect(result.user.displayName).toBe("Ada Lovelace");
    expect(result.rawToken).toBe("raw-token");
    expect(users.users).toHaveLength(1);
    expect(sessions.sessions).toHaveLength(1);
  });

  it("rejects an email address that is already registered", async () => {
    id = 0;
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionRepository();
    const handler = new RegisterHandler(
      users,
      passwordHasher,
      new SessionIssuer(sessions, tokenService, idGenerator, clock, 60_000),
      idGenerator,
      clock,
    );
    const command = {
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      password: "a-secure-password",
    };

    await handler.execute(command);

    await expect(handler.execute(command)).rejects.toMatchObject({
      code: "EMAIL_ALREADY_REGISTERED",
      statusCode: 409,
    });
  });
});
