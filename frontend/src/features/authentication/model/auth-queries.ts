import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuthSessionResponse,
  LoginRequest,
  RegisterRequest,
} from "../../../shared/api/contracts";

import { getSession, login, logout, register } from "../api/auth-api";

export const sessionQueryKey = ["auth", "session"] as const;

export function useSessionQuery() {
  return useQuery({ queryKey: sessionQueryKey, queryFn: getSession });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginRequest) => login(input),
    onSuccess: (session: AuthSessionResponse) => {
      queryClient.setQueryData(sessionQueryKey, session);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterRequest) => register(input),
    onSuccess: (session: AuthSessionResponse) => {
      queryClient.setQueryData(sessionQueryKey, session);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
