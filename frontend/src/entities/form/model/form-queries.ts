import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateFormRequest,
  FormListQuery,
  RenameFormRequest,
} from "../../../shared/api/contracts";

import {
  archiveForm,
  createForm,
  getForm,
  listForms,
  renameForm,
} from "../api/form-api";

export const formKeys = {
  all: ["forms"] as const,
  detail: (formId: string) => ["forms", "detail", formId] as const,
  lists: () => ["forms", "list"] as const,
  list: (workspaceId: string, query: FormListQuery) =>
    ["forms", "list", workspaceId, query] as const,
};

export function useFormListQuery(workspaceId: string, query: FormListQuery) {
  return useQuery({
    queryKey: formKeys.list(workspaceId, query),
    queryFn: () => listForms(workspaceId, query),
  });
}

export function useFormQuery(formId: string) {
  return useQuery({ queryKey: formKeys.detail(formId), queryFn: () => getForm(formId) });
}

export function useCreateFormMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFormRequest) => createForm(workspaceId, input),
    onSuccess: async (response) => {
      queryClient.setQueryData(formKeys.detail(response.data.form.id), response);
      await queryClient.invalidateQueries({ queryKey: formKeys.lists() });
    },
  });
}

export function useRenameFormMutation(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RenameFormRequest) => renameForm(formId, input),
    onSuccess: async (response) => {
      queryClient.setQueryData(formKeys.detail(formId), response);
      await queryClient.invalidateQueries({ queryKey: formKeys.lists() });
    },
  });
}

export function useArchiveFormMutation(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => archiveForm(formId),
    onSuccess: async (response) => {
      queryClient.setQueryData(formKeys.detail(formId), response);
      await queryClient.invalidateQueries({ queryKey: formKeys.lists() });
    },
  });
}
