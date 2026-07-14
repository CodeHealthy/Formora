import type { CookieOptions } from "express";

import type { Environment } from "../../../config/env.js";

export const SESSION_COOKIE_NAME = "formora_session";

export function createSessionCookieOptions(environment: Environment): CookieOptions {
  return {
    httpOnly: true,
    maxAge: environment.SESSION_TTL_HOURS * 60 * 60 * 1000,
    path: "/",
    sameSite: "lax",
    secure: environment.NODE_ENV === "production",
  };
}

export function createClearSessionCookieOptions(
  environment: Environment,
): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: environment.NODE_ENV === "production",
  };
}
