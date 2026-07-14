import pino, { type Logger } from "pino";

import type { Environment } from "./env.js";

export function createLogger(environment: Environment): Logger {
  return pino({
    level: environment.LOG_LEVEL,
    base: {
      service: "formora-api",
      environment: environment.NODE_ENV,
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "request.headers.authorization",
        "request.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  });
}
