import {
  apiErrorResponseSchema,
  authSessionResponseSchema,
  workspaceListResponseSchema,
  workspaceResponseSchema,
} from "@formora/contracts";
import mongoose from "mongoose";
import pino from "pino";
import request, { type Agent } from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import "../config/load-environment.js";

import type { Environment } from "../config/env.js";
import { sessionModel } from "../modules/auth/infrastructure/persistence/session.mongoose-model.js";
import { userModel } from "../modules/users/infrastructure/persistence/user.mongoose-model.js";
import { workspaceMembershipModel } from "../modules/workspaces/infrastructure/persistence/workspace-membership.mongoose-model.js";
import { workspaceModel } from "../modules/workspaces/infrastructure/persistence/workspace.mongoose-model.js";
import { createApp } from "./create-app.js";
import { registerModules } from "./register-modules.js";

let app: ReturnType<typeof createApp>;
let databaseConnected = false;
const integrationDatabaseUri = process.env.MONGODB_TEST_URI;
const integrationDatabaseName = "formora-integration-test";

async function registerUser(agent: Agent, email: string): Promise<void> {
  const response = await agent.post("/api/v1/auth/register").send({
    displayName: "Test User",
    email,
    password: "a-secure-password",
  });

  expect(response.status).toBe(201);
}

describe.skipIf(integrationDatabaseUri === undefined)("Phase 1 API", () => {
  beforeAll(async () => {
    if (integrationDatabaseUri === undefined) {
      throw new Error("MONGODB_TEST_URI is required for integration tests.");
    }

    // The explicit database override prevents a supplied cluster URI from
    // selecting or clearing the developer's normal application database.
    await mongoose.connect(integrationDatabaseUri, { dbName: integrationDatabaseName });
    databaseConnected = true;

    const environment: Environment = {
      NODE_ENV: "test",
      PORT: 3000,
      LOG_LEVEL: "silent",
      CORS_ORIGIN: "http://localhost:5173",
      MONGODB_URI: integrationDatabaseUri,
      MONGODB_DB_NAME: integrationDatabaseName,
      SESSION_TTL_HOURS: 168,
    };
    app = createApp({
      applicationRouter: registerModules(environment),
      environment,
      logger: pino({ level: "silent" }),
      readinessCheck: () => Promise.resolve(),
    });

    await Promise.all([
      userModel.syncIndexes(),
      sessionModel.syncIndexes(),
      workspaceModel.syncIndexes(),
      workspaceMembershipModel.syncIndexes(),
    ]);
  }, 120_000);

  beforeEach(async () => {
    await Promise.all([
      userModel.deleteMany({}),
      sessionModel.deleteMany({}),
      workspaceModel.deleteMany({}),
      workspaceMembershipModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    if (databaseConnected) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  });

  it("registers a user, sets a secure session cookie, and retrieves the session", async () => {
    const agent = request.agent(app);
    const registerResponse = await agent.post("/api/v1/auth/register").send({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      password: "a-secure-password",
    });
    const registerBody = authSessionResponseSchema.parse(registerResponse.body as unknown);
    const cookies = registerResponse.headers["set-cookie"] as string[] | undefined;

    expect(registerResponse.status).toBe(201);
    expect(registerBody.data.user.email).toBe("ada@example.com");
    expect(cookies?.[0]).toContain("HttpOnly");
    expect(cookies?.[0]).toContain("SameSite=Lax");

    const sessionResponse = await agent.get("/api/v1/auth/session");
    const sessionBody = authSessionResponseSchema.parse(sessionResponse.body as unknown);

    expect(sessionResponse.status).toBe(200);
    expect(sessionBody.data.user.id).toBe(registerBody.data.user.id);
  });

  it("rejects invalid registration data and duplicate email addresses", async () => {
    const invalidResponse = await request(app).post("/api/v1/auth/register").send({
      displayName: "A",
      email: "invalid",
      password: "short",
    });
    const invalidBody = apiErrorResponseSchema.parse(invalidResponse.body as unknown);

    expect(invalidResponse.status).toBe(400);
    expect(invalidBody.error.code).toBe("VALIDATION_ERROR");

    const agent = request.agent(app);
    await registerUser(agent, "duplicate@example.com");
    const duplicateResponse = await request(app).post("/api/v1/auth/register").send({
      displayName: "Another User",
      email: "DUPLICATE@example.com",
      password: "a-secure-password",
    });
    const duplicateBody = apiErrorResponseSchema.parse(duplicateResponse.body as unknown);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateBody.error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  it("logs in with valid credentials and revokes the session on logout", async () => {
    await registerUser(request.agent(app), "login@example.com");
    const agent = request.agent(app);

    const invalidLogin = await agent.post("/api/v1/auth/login").send({
      email: "login@example.com",
      password: "incorrect-password",
    });
    expect(invalidLogin.status).toBe(401);

    const loginResponse = await agent.post("/api/v1/auth/login").send({
      email: "login@example.com",
      password: "a-secure-password",
    });
    expect(loginResponse.status).toBe(200);

    const logoutResponse = await agent.post("/api/v1/auth/logout");
    expect(logoutResponse.status).toBe(200);

    const sessionResponse = await agent.get("/api/v1/auth/session");
    expect(sessionResponse.status).toBe(401);
  });

  it("protects workspace routes from unauthenticated requests", async () => {
    const response = await request(app).get("/api/v1/workspaces");
    const body = apiErrorResponseSchema.parse(response.body as unknown);

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  it("creates, lists, and retrieves an owner workspace", async () => {
    const agent = request.agent(app);
    await registerUser(agent, "owner@example.com");

    const createResponse = await agent
      .post("/api/v1/workspaces")
      .send({ name: "Acme Team" });
    const created = workspaceResponseSchema.parse(createResponse.body as unknown);

    expect(createResponse.status).toBe(201);
    expect(created.data.workspace).toMatchObject({ name: "Acme Team", role: "owner" });

    const listResponse = await agent.get("/api/v1/workspaces");
    const list = workspaceListResponseSchema.parse(listResponse.body as unknown);
    expect(list.data.workspaces).toHaveLength(1);

    const detailResponse = await agent.get(
      `/api/v1/workspaces/${created.data.workspace.id}`,
    );
    const detail = workspaceResponseSchema.parse(detailResponse.body as unknown);
    expect(detail.data.workspace.id).toBe(created.data.workspace.id);
  });

  it("returns 403 when another user requests a workspace", async () => {
    const owner = request.agent(app);
    const otherUser = request.agent(app);
    await registerUser(owner, "owner@example.com");
    await registerUser(otherUser, "viewer@example.com");
    const createResponse = await owner
      .post("/api/v1/workspaces")
      .send({ name: "Private Team" });
    const created = workspaceResponseSchema.parse(createResponse.body as unknown);

    const response = await otherUser.get(
      `/api/v1/workspaces/${created.data.workspace.id}`,
    );
    const body = apiErrorResponseSchema.parse(response.body as unknown);

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
