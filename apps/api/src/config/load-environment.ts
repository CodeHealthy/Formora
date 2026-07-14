import { resolve } from "node:path";

import { config } from "dotenv";

const rootEnvironmentPath = resolve(import.meta.dirname, "../../../../.env");

// Process-level variables keep precedence; the root file supplies local defaults only.
config({ path: rootEnvironmentPath, quiet: true });
