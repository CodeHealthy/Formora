import type { Request, RequestHandler, Response } from "express";
import type { Logger } from "pino";
import { pinoHttp } from "pino-http";

export function createRequestLogger(logger: Logger): RequestHandler {
  return pinoHttp<Request, Response>({
    logger,
    genReqId: (request) => request.requestId,
    customProps: (request) => ({
      requestId: request.requestId,
    }),
    customSuccessMessage: (request, response) =>
      `${request.method} ${request.url} completed with ${String(response.statusCode)}`,
    customErrorMessage: (request, response) =>
      `${request.method} ${request.url} failed with ${String(response.statusCode)}`,
  });
}
