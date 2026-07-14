import { describe, expect, it } from "vitest";

import { createWorkspaceRequestSchema } from "./workspace.contract.js";

describe("workspace contracts", () => {
  it("trims and accepts a valid workspace name", () => {
    const result = createWorkspaceRequestSchema.parse({ name: "  Acme  " });

    expect(result.name).toBe("Acme");
  });

  it("rejects an empty workspace name", () => {
    expect(createWorkspaceRequestSchema.safeParse({ name: " " }).success).toBe(false);
  });
});
