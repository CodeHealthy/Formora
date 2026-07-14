import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z, type ZodType } from "zod";

import { ApplicationError } from "../errors/application-error.js";

export interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const results = [
      { key: "body", schema: schemas.body, value: request.body as unknown },
      { key: "params", schema: schemas.params, value: request.params },
      { key: "query", schema: schemas.query, value: request.query },
    ] as const;

    for (const result of results) {
      if (result.schema === undefined) {
        continue;
      }

      const parsed = result.schema.safeParse(result.value);

      if (!parsed.success) {
        next(
          new ApplicationError(
            "VALIDATION_ERROR",
            "The request contains invalid data.",
            400,
            z.treeifyError(parsed.error),
          ),
        );
        return;
      }

      Object.defineProperty(request, result.key, {
        configurable: true,
        enumerable: true,
        value: parsed.data,
        writable: true,
      });
    }

    next();
  };
}
