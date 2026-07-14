import { createWorkspaceRequestSchema } from "@formora/contracts";
import { Router, type RequestHandler } from "express";
import { z } from "zod";

import { validateRequest } from "../../../core/http/validate-request.middleware.js";
import type { WorkspaceController } from "./workspace.controller.js";

interface WorkspaceParams {
  [key: string]: string;
  workspaceId: string;
}

const workspaceParamsSchema = z.object({
  workspaceId: z.string().regex(/^[a-f\d]{24}$/i),
});

export function createWorkspaceRouter(
  controller: WorkspaceController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);
  router.get("/", controller.list);
  router.post("/", validateRequest({ body: createWorkspaceRequestSchema }), controller.create);
  router.get<WorkspaceParams>(
    "/:workspaceId",
    validateRequest({ params: workspaceParamsSchema }),
    controller.get,
  );

  return router;
}
