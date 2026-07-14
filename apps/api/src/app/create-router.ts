import { Router } from "express";

import type { ReadinessCheck } from "../modules/health/application/readiness-check.js";
import { createHealthRouter } from "../modules/health/presentation/health.routes.js";

export function createRouter(
  readinessCheck: ReadinessCheck,
  applicationRouter: Router,
): Router {
  const router = Router();

  router.use("/health", createHealthRouter(readinessCheck));
  router.use("/api/v1", applicationRouter);

  return router;
}
