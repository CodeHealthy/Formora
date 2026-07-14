import { createHash, randomBytes } from "node:crypto";

import type {
  GeneratedSessionToken,
  SessionTokenService,
} from "../../application/ports/session-token-service.js";

export class Sha256SessionTokenService implements SessionTokenService {
  public generate(): GeneratedSessionToken {
    const rawToken = randomBytes(32).toString("base64url");
    return { rawToken, tokenHash: this.hash(rawToken) };
  }

  public hash(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }
}
