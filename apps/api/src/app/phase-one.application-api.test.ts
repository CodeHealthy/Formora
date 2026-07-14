import {
  apiErrorResponseSchema,
  authSessionResponseSchema,
  workspaceListResponseSchema,
  workspaceResponseSchema,
} from "@formora/contracts";
import { Router } from "express";
import pino from "pino";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import type { Environment } from "../config/env.js";
import type { IdGenerator } from "../core/identifiers/id-generator.js";
import type { Clock } from "../core/time/clock.js";
import { createAuthModule } from "../modules/auth/auth.module.js";
import type { PasswordHasher } from "../modules/auth/application/ports/password-hasher.js";
import type {
  GeneratedSessionToken,
  SessionTokenService,
} from "../modules/auth/application/ports/session-token-service.js";
import type { Session } from "../modules/auth/domain/session.js";
import type { SessionRepository } from "../modules/auth/domain/session.repository.js";
import type { User } from "../modules/users/domain/user.js";
import type { UserRepository } from "../modules/users/domain/user.repository.js";
import type { WorkspaceMembership } from "../modules/workspaces/domain/workspace-membership.js";
import type { WorkspaceMembershipRepository } from "../modules/workspaces/domain/workspace-membership.repository.js";
import type {
  WorkspaceRepository,
  WorkspaceWithMembership,
} from "../modules/workspaces/domain/workspace.repository.js";
import type { Workspace } from "../modules/workspaces/domain/workspace.js";
import { createWorkspacesModule } from "../modules/workspaces/workspaces.module.js";
import { createApp } from "./create-app.js";

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
    if (index >= 0) this.sessions.splice(index, 1);
    return Promise.resolve();
  }

  public findByTokenHash(tokenHash: string): Promise<Session | null> {
    return Promise.resolve(
      this.sessions.find((session) => session.tokenHash === tokenHash) ?? null,
    );
  }
}

class InMemoryWorkspaceRepository
  implements WorkspaceRepository, WorkspaceMembershipRepository
{
  public readonly items: WorkspaceWithMembership[] = [];

  public createWithOwner(
    workspace: Workspace,
    membership: WorkspaceMembership,
  ): Promise<void> {
    this.items.push({ workspace, membership });
    return Promise.resolve();
  }

  public findById(id: string): Promise<Workspace | null> {
    return Promise.resolve(
      this.items.find((item) => item.workspace.id === id)?.workspace ?? null,
    );
  }

  public listForUser(userId: string): Promise<WorkspaceWithMembership[]> {
    return Promise.resolve(this.items.filter((item) => item.membership.userId === userId));
  }

  public findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembership | null> {
    return Promise.resolve(
      this.items.find(
        (item) =>
          item.membership.workspaceId === workspaceId && item.membership.userId === userId,
      )?.membership ?? null,
    );
  }
}

const environment: Environment = {
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  CORS_ORIGIN: "http://localhost:5173",
  MONGODB_URI: "mongodb://localhost:27017/formora-test",
  MONGODB_DB_NAME: "formora-test",
  SESSION_TTL_HOURS: 168,
};
const clock: Clock = { now: () => new Date("2026-07-14T12:00:00.000Z") };
const passwordHasher: PasswordHasher = {
  hash: (password) => Promise.resolve(`hashed:${password}`),
  verify: (password, hash) => Promise.resolve(hash === `hashed:${password}`),
};

function createTestApplication() {
  let id = 0;
  let token = 0;
  const idGenerator: IdGenerator = {
    generate: () => String(++id).padStart(24, "0"),
  };
  const tokenService: SessionTokenService = {
    generate: (): GeneratedSessionToken => {
      const rawToken = `token-${String(++token)}`;
      return { rawToken, tokenHash: `hash:${rawToken}` };
    },
    hash: (rawToken) => `hash:${rawToken}`,
  };
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const workspaces = new InMemoryWorkspaceRepository();
  const authModule = createAuthModule({
    clock,
    environment,
    idGenerator,
    passwordHasher,
    sessionRepository: sessions,
    tokenService,
    userRepository: users,
  });
  const workspacesModule = createWorkspacesModule({
    authenticate: authModule.authenticate,
    clock,
    idGenerator,
    membershipRepository: workspaces,
    workspaceRepository: workspaces,
  });
  const applicationRouter = Router();
  applicationRouter.use("/auth", authModule.router);
  applicationRouter.use("/workspaces", workspacesModule.router);

  return createApp({
    applicationRouter,
    environment,
    logger: pino({ level: "silent" }),
    readinessCheck: () => Promise.resolve(),
  });
}

let app: ReturnType<typeof createTestApplication>;

async function registerUser(agent: ReturnType<typeof request.agent>, email: string) {
  return agent.post("/api/v1/auth/register").send({
    displayName: "Test User",
    email,
    password: "a-secure-password",
  });
}

describe("Phase 1 application API", () => {
  beforeEach(() => {
    app = createTestApplication();
  });

  it("registers a user and resolves the cookie-backed session", async () => {
    const agent = request.agent(app);
    const registration = await registerUser(agent, "ada@example.com");
    const registered = authSessionResponseSchema.parse(registration.body as unknown);

    expect(registration.status).toBe(201);
    expect(registration.headers["set-cookie"]).toBeDefined();

    const response = await agent.get("/api/v1/auth/session");
    const session = authSessionResponseSchema.parse(response.body as unknown);
    expect(session.data.user.id).toBe(registered.data.user.id);
  });

  it("validates registration and protects workspace routes", async () => {
    const invalidRegistration = await request(app).post("/api/v1/auth/register").send({
      displayName: "A",
      email: "invalid",
      password: "short",
    });
    const validationError = apiErrorResponseSchema.parse(
      invalidRegistration.body as unknown,
    );
    expect(validationError.error.code).toBe("VALIDATION_ERROR");

    const workspaceResponse = await request(app).get("/api/v1/workspaces");
    const authError = apiErrorResponseSchema.parse(workspaceResponse.body as unknown);
    expect(workspaceResponse.status).toBe(401);
    expect(authError.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  it("creates and lists an owner workspace", async () => {
    const agent = request.agent(app);
    await registerUser(agent, "owner@example.com");

    const createResponse = await agent
      .post("/api/v1/workspaces")
      .send({ name: "Acme Team" });
    const created = workspaceResponseSchema.parse(createResponse.body as unknown);
    expect(created.data.workspace.role).toBe("owner");

    const listResponse = await agent.get("/api/v1/workspaces");
    const list = workspaceListResponseSchema.parse(listResponse.body as unknown);
    expect(list.data.workspaces).toEqual([created.data.workspace]);
  });

  it("rejects a user without membership from workspace detail", async () => {
    const owner = request.agent(app);
    const otherUser = request.agent(app);
    await registerUser(owner, "owner@example.com");
    await registerUser(otherUser, "other@example.com");
    const createResponse = await owner
      .post("/api/v1/workspaces")
      .send({ name: "Private Team" });
    const created = workspaceResponseSchema.parse(createResponse.body as unknown);

    const response = await otherUser.get(
      `/api/v1/workspaces/${created.data.workspace.id}`,
    );
    const error = apiErrorResponseSchema.parse(response.body as unknown);
    expect(response.status).toBe(403);
    expect(error.error.code).toBe("FORBIDDEN");
  });
});
