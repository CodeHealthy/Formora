import type { ApiErrorResponse } from "@formora/contracts";
import type { ErrorRequestHandler } from "express";

import { ApplicationError } from "../errors/application-error.js";

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  if (error instanceof ApplicationError) {
    const body: ApiErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.requestId,
      },
    };

    response.status(error.statusCode).json(body);
    return;
  }

  request.log.error(
    { err: error, requestId: request.requestId },
    "Unhandled request error",
  );

  const body: ApiErrorResponse = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
      details: null,
      requestId: request.requestId,
    },
  };

  response.status(500).json(body);
};
