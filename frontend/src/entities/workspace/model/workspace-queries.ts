import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateWorkspaceRequest } from "../../../shared/api/contracts";

import { createWorkspace, getWorkspace, listWorkspaces } from "../api/workspace-api";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (workspaceId: string) => ["workspaces", "detail", workspaceId] as const,
  list: ["workspaces", "list"] as const,
};

export function useWorkspaceListQuery() {
  return useQuery({ queryKey: workspaceKeys.list, queryFn: listWorkspaces });
}

export function useWorkspaceQuery(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
  });
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceRequest) => createWorkspace(input),
    onSuccess: async (response) => {
      queryClient.setQueryData(workspaceKeys.detail(response.data.workspace.id), response);
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list });
    },
  });
}
