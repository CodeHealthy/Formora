import type { SessionRepository } from "../../../domain/session.repository.js";
import type { SessionTokenService } from "../../ports/session-token-service.js";

export class LogoutHandler {
  public constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: SessionTokenService,
  ) {}

  public async execute(rawToken: string | undefined): Promise<void> {
    if (rawToken === undefined || rawToken.length === 0) {
      return;
    }

    await this.sessionRepository.deleteByTokenHash(this.tokenService.hash(rawToken));
  }
}
