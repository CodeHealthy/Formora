import { ApplicationError } from "../../../../core/errors/application-error.js";
import type { Clock } from "../../../../core/time/clock.js";
import type { SessionRepository } from "../../domain/session.repository.js";
import type { SessionTokenService } from "../ports/session-token-service.js";

export interface AuthenticatedActor {
  sessionId: string;
  userId: string;
}

export class AuthenticateSession {
  public constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: SessionTokenService,
    private readonly clock: Clock,
  ) {}

  public async execute(rawToken: string | undefined): Promise<AuthenticatedActor> {
    if (rawToken === undefined || rawToken.length === 0) {
      throw new ApplicationError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      );
    }

    const tokenHash = this.tokenService.hash(rawToken);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);

    if (session === null) {
      throw new ApplicationError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      );
    }

    if (session.expiresAt.getTime() <= this.clock.now().getTime()) {
      await this.sessionRepository.deleteByTokenHash(tokenHash);
      throw new ApplicationError("SESSION_EXPIRED", "The session has expired.", 401);
    }

    return { sessionId: session.id, userId: session.userId };
  }
}
