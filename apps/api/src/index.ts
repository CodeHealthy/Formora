import "./config/load-environment.js";

import { createApp } from "./app/create-app.js";
import { registerModules } from "./app/register-modules.js";
import { parseEnvironment } from "./config/env.js";
import { createLogger } from "./config/logger.js";
import { MongooseDatabase } from "./infrastructure/database/mongoose-database.js";
import { startServer } from "./server.js";

async function bootstrap(): Promise<void> {
  const environment = parseEnvironment(process.env);
  const logger = createLogger(environment);
  const database = new MongooseDatabase();

  await database.connect({
    databaseName: environment.MONGODB_DB_NAME,
    uri: environment.MONGODB_URI,
  });

  const app = createApp({
    applicationRouter: registerModules(environment),
    environment,
    logger,
    readinessCheck: database.readinessCheck,
  });
  const server = startServer(app, environment.PORT, logger);

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, "Graceful shutdown started");

    server.close((serverError) => {
      void database
        .disconnect()
        .then(() => {
          if (serverError !== undefined) {
            logger.error({ err: serverError }, "HTTP server shutdown failed");
            process.exitCode = 1;
          }
        })
        .catch((databaseError: unknown) => {
          logger.error({ err: databaseError }, "Database shutdown failed");
          process.exitCode = 1;
        });
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

bootstrap().catch((error: unknown) => {
  // Bootstrap failures happen before the application logger is guaranteed to exist.
  process.stderr.write(`Formora API failed to start: ${String(error)}\n`);
  process.exitCode = 1;
});
