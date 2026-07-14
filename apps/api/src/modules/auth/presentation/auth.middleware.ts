import type { NextFunction, Request, Response } from "express";

import { SESSION_COOKIE_NAME } from "./session-cookie.js";
import type { AuthenticateSession } from "../application/services/authenticate-session.js";

export function createAuthenticationMiddleware(
  authenticateSession: AuthenticateSession,
) {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    try {
      const token = request.cookies[SESSION_COOKIE_NAME] as unknown;
      const actor = await authenticateSession.execute(
        typeof token === "string" ? token : undefined,
      );
      request.auth = actor;
      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}
