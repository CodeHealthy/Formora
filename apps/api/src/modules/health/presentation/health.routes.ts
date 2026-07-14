import type { HealthResponse } from "@formora/contracts";
import { Router } from "express";

import type { ReadinessCheck } from "../application/readiness-check.js";

export function createHealthRouter(readinessCheck: ReadinessCheck): Router {
  const router = Router();

  router.get("/live", (request, response) => {
    const body: HealthResponse = {
      data: { status: "ok" },
      meta: { requestId: request.requestId },
    };

    response.status(200).json(body);
  });

  router.get("/ready", async (request, response) => {
    try {
      await readinessCheck();

      const body: HealthResponse = {
        data: { status: "ok" },
        meta: { requestId: request.requestId },
      };

      response.status(200).json(body);
    } catch (error: unknown) {
      request.log.warn(
        { err: error, requestId: request.requestId },
        "Readiness check failed",
      );

      const body: HealthResponse = {
        data: { status: "unavailable" },
        meta: { requestId: request.requestId },
      };

      response.status(503).json(body);
    }
  });

  return router;
}
