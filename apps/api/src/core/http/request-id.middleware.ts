import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

const requestIdPattern = /^[a-zA-Z0-9._-]{1,128}$/;

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const suppliedRequestId = request.header("x-request-id");
  request.requestId =
    suppliedRequestId !== undefined && requestIdPattern.test(suppliedRequestId)
      ? suppliedRequestId
      : `req_${randomUUID()}`;

  response.setHeader("x-request-id", request.requestId);
  next();
}
