import type {
  CreateWorkspaceRequest,
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@formora/contracts";
import type { Request, Response } from "express";

import { ApplicationError } from "../../../core/errors/application-error.js";
import type { CreateWorkspaceHandler } from "../application/commands/create-workspace/create-workspace.handler.js";
import type { GetWorkspaceHandler } from "../application/queries/get-workspace/get-workspace.handler.js";
import type { ListWorkspacesHandler } from "../application/queries/list-workspaces/list-workspaces.handler.js";
import { presentWorkspaceList, presentWorkspaceResponse } from "./workspace.presenter.js";

interface WorkspaceParams {
  [key: string]: string;
  workspaceId: string;
}

function requireActorId(request: {
  auth?: { sessionId: string; userId: string };
}): string {
  if (request.auth === undefined) {
    throw new ApplicationError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      401,
    );
  }

  return request.auth.userId;
}

export class WorkspaceController {
  public constructor(
    private readonly createWorkspaceHandler: CreateWorkspaceHandler,
    private readonly listWorkspacesHandler: ListWorkspacesHandler,
    private readonly getWorkspaceHandler: GetWorkspaceHandler,
  ) {}

  public create = async (
    request: Request<Record<string, never>, WorkspaceResponse, CreateWorkspaceRequest>,
    response: Response<WorkspaceResponse>,
  ): Promise<void> => {
    const result = await this.createWorkspaceHandler.execute({
      actorId: requireActorId(request),
      name: request.body.name,
    });
    response.status(201).json(
      presentWorkspaceResponse(
        { workspace: result.workspace, membership: result.membership },
        request.requestId,
      ),
    );
  };

  public list = async (
    request: Request,
    response: Response<WorkspaceListResponse>,
  ): Promise<void> => {
    const workspaces = await this.listWorkspacesHandler.execute(requireActorId(request));
    response.status(200).json(presentWorkspaceList(workspaces, request.requestId));
  };

  public get = async (
    request: Request<WorkspaceParams>,
    response: Response<WorkspaceResponse>,
  ): Promise<void> => {
    const result = await this.getWorkspaceHandler.execute(
      requireActorId(request),
      request.params.workspaceId,
    );
    response.status(200).json(presentWorkspaceResponse(result, request.requestId));
  };
}
