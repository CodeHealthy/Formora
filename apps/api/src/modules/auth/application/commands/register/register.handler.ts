import { ApplicationError } from "../../../../../core/errors/application-error.js";
import type { IdGenerator } from "../../../../../core/identifiers/id-generator.js";
import type { Clock } from "../../../../../core/time/clock.js";
import type { User } from "../../../../users/domain/user.js";
import { EmailAlreadyExistsError } from "../../../../users/domain/user.errors.js";
import type { UserRepository } from "../../../../users/domain/user.repository.js";
import type { PasswordHasher } from "../../ports/password-hasher.js";
import type { IssuedSession, SessionIssuer } from "../../services/session-issuer.js";

export interface RegisterCommand {
  displayName: string;
  email: string;
  password: string;
}

export interface RegisterResult extends IssuedSession {
  user: User;
}

export class RegisterHandler {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(command: RegisterCommand): Promise<RegisterResult> {
    const emailNormalized = command.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findByNormalizedEmail(emailNormalized);

    if (existingUser !== null) {
      throw new ApplicationError(
        "EMAIL_ALREADY_REGISTERED",
        "A user with this email address already exists.",
        409,
      );
    }

    const now = this.clock.now();
    const user: User = {
      id: this.idGenerator.generate(),
      displayName: command.displayName.trim(),
      email: command.email.trim(),
      emailNormalized,
      passwordHash: await this.passwordHasher.hash(command.password),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.userRepository.create(user);
    } catch (error: unknown) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ApplicationError(
          "EMAIL_ALREADY_REGISTERED",
          "A user with this email address already exists.",
          409,
        );
      }

      throw error;
    }

    const issuedSession = await this.sessionIssuer.issue(user.id);
    return { user, ...issuedSession };
  }
}
