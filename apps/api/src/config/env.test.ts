import { describe, expect, it } from "vitest";

import { parseEnvironment } from "./env.js";

describe("parseEnvironment", () => {
  it("parses a valid environment and applies defaults", () => {
    const environment = parseEnvironment({
      CORS_ORIGIN: "http://localhost:5173",
      MONGODB_URI: "mongodb://localhost:27017/formora",
      MONGODB_DB_NAME: "formora",
    });

    expect(environment).toMatchObject({
      NODE_ENV: "development",
      PORT: 3000,
      LOG_LEVEL: "info",
      MONGODB_DB_NAME: "formora",
      SESSION_TTL_HOURS: 168,
    });
  });

  it("rejects an invalid MongoDB URI", () => {
    expect(() =>
      parseEnvironment({
        CORS_ORIGIN: "http://localhost:5173",
        MONGODB_URI: "https://example.com/database",
        MONGODB_DB_NAME: "formora",
      }),
    ).toThrow("Invalid API environment");
  });

  it("rejects a database name containing unsupported characters", () => {
    expect(() =>
      parseEnvironment({
        CORS_ORIGIN: "http://localhost:5173",
        MONGODB_URI: "mongodb://localhost:27017",
        MONGODB_DB_NAME: "formora development",
      }),
    ).toThrow("Invalid API environment");
  });
});
