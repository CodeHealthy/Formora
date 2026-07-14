import type { NextFunction, Request, Response } from "express";

import { ApplicationError } from "../errors/application-error.js";

export function notFoundMiddleware(
  _request: Request,
  _response: Response,
  next: NextFunction,
): void {
  next(new ApplicationError("ROUTE_NOT_FOUND", "The requested route was not found.", 404));
}
