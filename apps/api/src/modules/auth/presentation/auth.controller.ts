import type {
  AuthSessionResponse,
  LoginRequest,
  LogoutResponse,
  RegisterRequest,
} from "@formora/contracts";
import type { Request, Response } from "express";

import { ApplicationError } from "../../../core/errors/application-error.js";
import type { LoginHandler } from "../application/commands/login/login.handler.js";
import type { LogoutHandler } from "../application/commands/logout/logout.handler.js";
import type { RegisterHandler } from "../application/commands/register/register.handler.js";
import type { GetSessionHandler } from "../application/queries/get-session/get-session.handler.js";
import { presentLogout, presentSession } from "./auth.presenter.js";
import {
  SESSION_COOKIE_NAME,
  type createClearSessionCookieOptions,
  type createSessionCookieOptions,
} from "./session-cookie.js";

type SessionCookieOptions = ReturnType<typeof createSessionCookieOptions>;
type ClearSessionCookieOptions = ReturnType<typeof createClearSessionCookieOptions>;

export class AuthController {
  public constructor(
    private readonly registerHandler: RegisterHandler,
    private readonly loginHandler: LoginHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly getSessionHandler: GetSessionHandler,
    private readonly cookieOptions: SessionCookieOptions,
    private readonly clearCookieOptions: ClearSessionCookieOptions,
  ) {}

  public register = async (
    request: Request<Record<string, never>, AuthSessionResponse, RegisterRequest>,
    response: Response<AuthSessionResponse>,
  ): Promise<void> => {
    const result = await this.registerHandler.execute(request.body);
    response.cookie(SESSION_COOKIE_NAME, result.rawToken, this.cookieOptions);
    response.status(201).json(presentSession(result.user, request.requestId));
  };

  public login = async (
    request: Request<Record<string, never>, AuthSessionResponse, LoginRequest>,
    response: Response<AuthSessionResponse>,
  ): Promise<void> => {
    const result = await this.loginHandler.execute(request.body);
    response.cookie(SESSION_COOKIE_NAME, result.rawToken, this.cookieOptions);
    response.status(200).json(presentSession(result.user, request.requestId));
  };

  public logout = async (
    request: Request<Record<string, never>, LogoutResponse>,
    response: Response<LogoutResponse>,
  ): Promise<void> => {
    const token = request.cookies[SESSION_COOKIE_NAME] as unknown;
    await this.logoutHandler.execute(typeof token === "string" ? token : undefined);
    response.clearCookie(SESSION_COOKIE_NAME, this.clearCookieOptions);
    response.status(200).json(presentLogout(request.requestId));
  };

  public getSession = async (
    request: Request,
    response: Response<AuthSessionResponse>,
  ): Promise<void> => {
    if (request.auth === undefined) {
      throw new ApplicationError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      );
    }

    const user = await this.getSessionHandler.execute(request.auth.userId);
    response.status(200).json(presentSession(user, request.requestId));
  };
}
