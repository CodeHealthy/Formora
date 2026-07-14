import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateFormRequest,
  FormListQuery,
  FormDefinition,
  FormAccessRequest,
  RenameFormRequest,
} from "../../../shared/api/contracts";

import {
  archiveForm,
  createForm,
  getForm,
  listForms,
  renameForm,
  getFormDraft,
  saveFormDraft,
  getFormAccessSettings,
  updateFormAccessSettings,
  publishForm,
  unpublishForm,
} from "../api/form-api";

export const formKeys = {
  all: ["forms"] as const,
  detail: (formId: string) => ["forms", "detail", formId] as const,
  draft: (formId: string) => ["forms", "draft", formId] as const,
  access: (formId: string) => ["forms", "access", formId] as const,
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

export function useFormDraftQuery(formId: string) {
  return useQuery({ queryKey: formKeys.draft(formId), queryFn: () => getFormDraft(formId) });
}

export function useSaveFormDraftMutation(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (definition: FormDefinition) => saveFormDraft(formId, definition),
    onSuccess: (response) => {
      queryClient.setQueryData(formKeys.draft(formId), response);
      void queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      void queryClient.invalidateQueries({ queryKey: formKeys.lists() });
    },
  });
}

export function useFormAccessQuery(formId: string) {
  return useQuery({
    queryKey: formKeys.access(formId),
    queryFn: () => getFormAccessSettings(formId),
  });
}

export function useUpdateFormAccessMutation(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FormAccessRequest) => updateFormAccessSettings(formId, input),
    onSuccess: (response) => queryClient.setQueryData(formKeys.access(formId), response),
  });
}

export function usePublishFormMutation(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishForm(formId),
    onSuccess: async (response) => {
      queryClient.setQueryData(formKeys.detail(formId), response);
      await queryClient.invalidateQueries({ queryKey: formKeys.lists() });
    },
  });
}

export function useUnpublishFormMutation(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unpublishForm(formId),
    onSuccess: async (response) => {
      queryClient.setQueryData(formKeys.detail(formId), response);
      await queryClient.invalidateQueries({ queryKey: formKeys.lists() });
    },
  });
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
