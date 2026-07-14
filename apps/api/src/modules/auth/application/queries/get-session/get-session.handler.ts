import { ApplicationError } from "../../../../../core/errors/application-error.js";
import type { User } from "../../../../users/domain/user.js";
import type { UserRepository } from "../../../../users/domain/user.repository.js";

export class GetSessionHandler {
  public constructor(private readonly userRepository: UserRepository) {}

  public async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      throw new ApplicationError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      );
    }

    return user;
  }
}
