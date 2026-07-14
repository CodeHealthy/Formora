import { Router } from "express";

import type { Environment } from "../config/env.js";
import { SystemClock } from "../core/time/system-clock.js";
import { MongoIdGenerator } from "../infrastructure/database/mongo-id-generator.js";
import { createAuthModule } from "../modules/auth/auth.module.js";
import { MongoSessionRepository } from "../modules/auth/infrastructure/persistence/mongo-session.repository.js";
import { ScryptPasswordHasher } from "../modules/auth/infrastructure/security/scrypt-password-hasher.js";
import { Sha256SessionTokenService } from "../modules/auth/infrastructure/security/sha256-session-token-service.js";
import { MongoUserRepository } from "../modules/users/infrastructure/persistence/mongo-user.repository.js";
import { MongoWorkspaceMembershipRepository } from "../modules/workspaces/infrastructure/persistence/mongo-workspace-membership.repository.js";
import { MongoWorkspaceRepository } from "../modules/workspaces/infrastructure/persistence/mongo-workspace.repository.js";
import { createWorkspacesModule } from "../modules/workspaces/workspaces.module.js";

export function registerModules(environment: Environment): Router {
  const router = Router();
  const clock = new SystemClock();
  const idGenerator = new MongoIdGenerator();
  const userRepository = new MongoUserRepository();
  const sessionRepository = new MongoSessionRepository();
  const authModule = createAuthModule({
    clock,
    environment,
    idGenerator,
    passwordHasher: new ScryptPasswordHasher(),
    sessionRepository,
    tokenService: new Sha256SessionTokenService(),
    userRepository,
  });
  const workspacesModule = createWorkspacesModule({
    authenticate: authModule.authenticate,
    clock,
    idGenerator,
    membershipRepository: new MongoWorkspaceMembershipRepository(),
    workspaceRepository: new MongoWorkspaceRepository(),
  });

  router.use("/auth", authModule.router);
  router.use("/workspaces", workspacesModule.router);

  return router;
}
