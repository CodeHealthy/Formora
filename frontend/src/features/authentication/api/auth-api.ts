import {
  authSessionResponseSchema,
  logoutResponseSchema,
  type AuthSessionResponse,
  type LoginRequest,
  type LogoutResponse,
  type RegisterRequest,
} from "../../../shared/api/contracts";

import { getValidated, requestValidated } from "../../../shared/api/api-client";

export function getSession(): Promise<AuthSessionResponse> {
  return getValidated("/auth/session", authSessionResponseSchema);
}

export function register(input: RegisterRequest): Promise<AuthSessionResponse> {
  return requestValidated("/auth/register", authSessionResponseSchema, {
    body: input,
    method: "POST",
  });
}

export function login(input: LoginRequest): Promise<AuthSessionResponse> {
  return requestValidated("/auth/login", authSessionResponseSchema, {
    body: input,
    method: "POST",
  });
}

export function logout(): Promise<LogoutResponse> {
  return requestValidated("/auth/logout", logoutResponseSchema, { method: "POST" });
}
