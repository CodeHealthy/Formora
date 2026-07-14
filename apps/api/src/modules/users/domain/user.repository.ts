import type { User } from "./user.js";

export interface UserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByNormalizedEmail(emailNormalized: string): Promise<User | null>;
}
