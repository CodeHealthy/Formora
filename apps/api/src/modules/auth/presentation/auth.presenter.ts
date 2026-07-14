import type {
  AuthSessionResponse,
  AuthUser,
  LogoutResponse,
} from "@formora/contracts";

import type { User } from "../../users/domain/user.js";

export function presentAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export function presentSession(user: User, requestId: string): AuthSessionResponse {
  return {
    data: { user: presentAuthUser(user) },
    meta: { requestId },
  };
}

export function presentLogout(requestId: string): LogoutResponse {
  return {
    data: { success: true },
    meta: { requestId },
  };
}
