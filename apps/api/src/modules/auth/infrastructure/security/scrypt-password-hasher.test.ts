import { describe, expect, it } from "vitest";

import { ScryptPasswordHasher } from "./scrypt-password-hasher.js";

describe("ScryptPasswordHasher", () => {
  it("verifies the password used to produce a hash", async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash("a-secure-password");

    await expect(hasher.verify("a-secure-password", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash("a-secure-password");

    await expect(hasher.verify("incorrect-password", hash)).resolves.toBe(false);
  });
});
