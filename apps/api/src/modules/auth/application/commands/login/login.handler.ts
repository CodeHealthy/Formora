import { ApplicationError } from "../../../../../core/errors/application-error.js";
import type { User } from "../../../../users/domain/user.js";
import type { UserRepository } from "../../../../users/domain/user.repository.js";
import type { PasswordHasher } from "../../ports/password-hasher.js";
import type { IssuedSession, SessionIssuer } from "../../services/session-issuer.js";

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult extends IssuedSession {
  user: User;
}

export class LoginHandler {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
  ) {}

  public async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.userRepository.findByNormalizedEmail(
      command.email.trim().toLowerCase(),
    );
    const passwordMatches =
      user === null
        ? false
        : await this.passwordHasher.verify(command.password, user.passwordHash);

    if (user === null || !passwordMatches) {
      throw new ApplicationError(
        "INVALID_CREDENTIALS",
        "The email address or password is incorrect.",
        401,
      );
    }

    const issuedSession = await this.sessionIssuer.issue(user.id);
    return { user, ...issuedSession };
  }
}
