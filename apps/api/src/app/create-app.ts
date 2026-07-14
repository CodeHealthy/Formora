import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Express, type Router } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import type { Logger } from "pino";

import type { Environment } from "../config/env.js";
import { errorHandlerMiddleware } from "../core/http/error-handler.middleware.js";
import { notFoundMiddleware } from "../core/http/not-found.middleware.js";
import { requestIdMiddleware } from "../core/http/request-id.middleware.js";
import { createRequestLogger } from "../core/http/request-logger.middleware.js";
import type { ReadinessCheck } from "../modules/health/application/readiness-check.js";
import { createRouter } from "./create-router.js";

export interface CreateAppDependencies {
  environment: Environment;
  logger: Logger;
  readinessCheck: ReadinessCheck;
  applicationRouter: Router;
}

export function createApp(dependencies: CreateAppDependencies): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(createRequestLogger(dependencies.logger));
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin: dependencies.environment.CORS_ORIGIN,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      windowMs: 60_000,
    }),
  );

  app.use(createRouter(dependencies.readinessCheck, dependencies.applicationRouter));
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
