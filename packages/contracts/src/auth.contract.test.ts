import { describe, expect, it } from "vitest";

import { loginRequestSchema, registerRequestSchema } from "./auth.contract.js";

describe("authentication contracts", () => {
  it("accepts a valid registration payload", () => {
    expect(
      registerRequestSchema.safeParse({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        password: "a-secure-password",
      }).success,
    ).toBe(true);
  });

  it("rejects short registration passwords", () => {
    expect(
      registerRequestSchema.safeParse({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("rejects malformed login email addresses", () => {
    expect(
      loginRequestSchema.safeParse({
        email: "not-an-email",
        password: "a-secure-password",
      }).success,
    ).toBe(false);
  });
});
