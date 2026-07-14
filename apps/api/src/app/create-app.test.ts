import {
  apiErrorResponseSchema,
  healthResponseSchema,
} from "@formora/contracts";
import pino from "pino";
import { Router } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./create-app.js";
import type { Environment } from "../config/env.js";

const testEnvironment: Environment = {
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  CORS_ORIGIN: "http://localhost:5173",
  MONGODB_URI: "mongodb://localhost:27017/formora-test",
  MONGODB_DB_NAME: "formora-test",
  SESSION_TTL_HOURS: 168,
};

function buildTestApp(
  readinessCheck: () => Promise<void> = () => Promise.resolve(),
) {
  return createApp({
    applicationRouter: Router(),
    environment: testEnvironment,
    logger: pino({ level: "silent" }),
    readinessCheck,
  });
}

describe("API application", () => {
  it("reports that the process is live and returns a request ID", async () => {
    const response = await request(buildTestApp())
      .get("/health/live")
      .set("x-request-id", "req_test");

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe("req_test");
    expect(response.body).toEqual({
      data: { status: "ok" },
      meta: { requestId: "req_test" },
    });
  });

  it("reports readiness when required dependencies are available", async () => {
    const response = await request(buildTestApp()).get("/health/ready");
    const body = healthResponseSchema.parse(response.body as unknown);

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ status: "ok" });
  });

  it("returns 503 when a required dependency is unavailable", async () => {
    const response = await request(
      buildTestApp(() => Promise.reject(new Error("database unavailable"))),
    ).get("/health/ready");
    const body = healthResponseSchema.parse(response.body as unknown);

    expect(response.status).toBe(503);
    expect(body.data).toEqual({ status: "unavailable" });
  });

  it("maps unknown routes through centralized error handling", async () => {
    const response = await request(buildTestApp()).get("/missing");
    const body = apiErrorResponseSchema.parse(response.body as unknown);

    expect(response.status).toBe(404);
    expect(body.error).toMatchObject({
      code: "ROUTE_NOT_FOUND",
      message: "The requested route was not found.",
      details: null,
    });
    expect(body.error.requestId).toEqual(expect.any(String));
  });
});
