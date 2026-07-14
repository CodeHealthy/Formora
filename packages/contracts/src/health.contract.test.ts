import { describe, expect, it } from "vitest";

import { healthResponseSchema } from "./health.contract.js";

describe("healthResponseSchema", () => {
  it("accepts a valid health response", () => {
    const result = healthResponseSchema.safeParse({
      data: { status: "ok" },
      meta: { requestId: "req_123" },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown health status", () => {
    const result = healthResponseSchema.safeParse({
      data: { status: "degraded" },
      meta: { requestId: "req_123" },
    });

    expect(result.success).toBe(false);
  });
});
