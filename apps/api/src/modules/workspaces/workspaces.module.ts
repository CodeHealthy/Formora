import type { RequestHandler, Router } from "express";

import type { IdGenerator } from "../../core/identifiers/id-generator.js";
import type { Clock } from "../../core/time/clock.js";
import type { WorkspaceMembershipRepository } from "./domain/workspace-membership.repository.js";
import type { WorkspaceRepository } from "./domain/workspace.repository.js";
import { CreateWorkspaceHandler } from "./application/commands/create-workspace/create-workspace.handler.js";
import { GetWorkspaceHandler } from "./application/queries/get-workspace/get-workspace.handler.js";
import { ListWorkspacesHandler } from "./application/queries/list-workspaces/list-workspaces.handler.js";
import { WorkspaceAuthorizationService } from "./application/services/workspace-authorization.service.js";
import { WorkspaceController } from "./presentation/workspace.controller.js";
import { createWorkspaceRouter } from "./presentation/workspace.routes.js";

export interface WorkspacesModuleDependencies {
  authenticate: RequestHandler;
  clock: Clock;
  idGenerator: IdGenerator;
  membershipRepository: WorkspaceMembershipRepository;
  workspaceRepository: WorkspaceRepository;
}

export interface WorkspacesModule {
  authorizationService: WorkspaceAuthorizationService;
  router: Router;
}

export function createWorkspacesModule(
  dependencies: WorkspacesModuleDependencies,
): WorkspacesModule {
  const authorizationService = new WorkspaceAuthorizationService(
    dependencies.membershipRepository,
  );
  const controller = new WorkspaceController(
    new CreateWorkspaceHandler(
      dependencies.workspaceRepository,
      dependencies.idGenerator,
      dependencies.clock,
    ),
    new ListWorkspacesHandler(dependencies.workspaceRepository),
    new GetWorkspaceHandler(dependencies.workspaceRepository, authorizationService),
  );

  return {
    authorizationService,
    router: createWorkspaceRouter(controller, dependencies.authenticate),
  };
}
