import type { Server } from "node:http";

import type { Express } from "express";
import type { Logger } from "pino";

export function startServer(app: Express, port: number, logger: Logger): Server {
  return app.listen(port, () => {
    logger.info({ port }, "Formora API is listening");
  });
}
