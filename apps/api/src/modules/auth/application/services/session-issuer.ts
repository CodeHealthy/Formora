import type { IdGenerator } from "../../../../core/identifiers/id-generator.js";
import type { Clock } from "../../../../core/time/clock.js";
import type { Session } from "../../domain/session.js";
import type { SessionRepository } from "../../domain/session.repository.js";
import type { SessionTokenService } from "../ports/session-token-service.js";

export interface IssuedSession {
  session: Session;
  rawToken: string;
}

export class SessionIssuer {
  public constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: SessionTokenService,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly sessionTtlMs: number,
  ) {}

  public async issue(userId: string): Promise<IssuedSession> {
    const now = this.clock.now();
    const generatedToken = this.tokenService.generate();
    const session: Session = {
      id: this.idGenerator.generate(),
      userId,
      tokenHash: generatedToken.tokenHash,
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + this.sessionTtlMs),
    };

    await this.sessionRepository.create(session);

    return { session, rawToken: generatedToken.rawToken };
  }
}
