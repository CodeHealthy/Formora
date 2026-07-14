import { loginRequestSchema, registerRequestSchema } from "@formora/contracts";
import { Router, type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

import { validateRequest } from "../../../core/http/validate-request.middleware.js";
import type { AuthController } from "./auth.controller.js";

export function createAuthRouter(
  controller: AuthController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const authRateLimit = rateLimit({
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    windowMs: 60_000,
  });

  router.post(
    "/register",
    authRateLimit,
    validateRequest({ body: registerRequestSchema }),
    controller.register,
  );
  router.post(
    "/login",
    authRateLimit,
    validateRequest({ body: loginRequestSchema }),
    controller.login,
  );
  router.post("/logout", controller.logout);
  router.get("/session", authenticate, controller.getSession);

  return router;
}
