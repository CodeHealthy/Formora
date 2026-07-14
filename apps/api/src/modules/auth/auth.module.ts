import type { RequestHandler, Router } from "express";

import type { Environment } from "../../config/env.js";
import type { IdGenerator } from "../../core/identifiers/id-generator.js";
import type { Clock } from "../../core/time/clock.js";
import type { UserRepository } from "../users/domain/user.repository.js";
import { LoginHandler } from "./application/commands/login/login.handler.js";
import { LogoutHandler } from "./application/commands/logout/logout.handler.js";
import { RegisterHandler } from "./application/commands/register/register.handler.js";
import { GetSessionHandler } from "./application/queries/get-session/get-session.handler.js";
import type { PasswordHasher } from "./application/ports/password-hasher.js";
import type { SessionTokenService } from "./application/ports/session-token-service.js";
import { AuthenticateSession } from "./application/services/authenticate-session.js";
import { SessionIssuer } from "./application/services/session-issuer.js";
import type { SessionRepository } from "./domain/session.repository.js";
import { AuthController } from "./presentation/auth.controller.js";
import { createAuthenticationMiddleware } from "./presentation/auth.middleware.js";
import { createAuthRouter } from "./presentation/auth.routes.js";
import {
  createClearSessionCookieOptions,
  createSessionCookieOptions,
} from "./presentation/session-cookie.js";

export interface AuthModuleDependencies {
  clock: Clock;
  environment: Environment;
  idGenerator: IdGenerator;
  passwordHasher: PasswordHasher;
  sessionRepository: SessionRepository;
  tokenService: SessionTokenService;
  userRepository: UserRepository;
}

export interface AuthModule {
  authenticate: RequestHandler;
  router: Router;
}

export function createAuthModule(dependencies: AuthModuleDependencies): AuthModule {
  const sessionIssuer = new SessionIssuer(
    dependencies.sessionRepository,
    dependencies.tokenService,
    dependencies.idGenerator,
    dependencies.clock,
    dependencies.environment.SESSION_TTL_HOURS * 60 * 60 * 1000,
  );
  const registerHandler = new RegisterHandler(
    dependencies.userRepository,
    dependencies.passwordHasher,
    sessionIssuer,
    dependencies.idGenerator,
    dependencies.clock,
  );
  const loginHandler = new LoginHandler(
    dependencies.userRepository,
    dependencies.passwordHasher,
    sessionIssuer,
  );
  const logoutHandler = new LogoutHandler(
    dependencies.sessionRepository,
    dependencies.tokenService,
  );
  const getSessionHandler = new GetSessionHandler(dependencies.userRepository);
  const authenticateSession = new AuthenticateSession(
    dependencies.sessionRepository,
    dependencies.tokenService,
    dependencies.clock,
  );
  const authenticate = createAuthenticationMiddleware(authenticateSession);
  const controller = new AuthController(
    registerHandler,
    loginHandler,
    logoutHandler,
    getSessionHandler,
    createSessionCookieOptions(dependencies.environment),
    createClearSessionCookieOptions(dependencies.environment),
  );

  return {
    authenticate,
    router: createAuthRouter(controller, authenticate),
  };
}
