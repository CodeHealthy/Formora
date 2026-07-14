import {
  formListResponseSchema,
  formDraftResponseSchema,
  formAccessResponseSchema,
  formResponseSchema,
  type CreateFormRequest,
  type FormListQuery,
  type FormListResponse,
  type FormResponse,
  type FormDefinition,
  type FormDraftResponse,
  type FormAccessRequest,
  type FormAccessResponse,
  type RenameFormRequest,
} from "../../../shared/api/contracts";

import { getValidated, requestValidated } from "../../../shared/api/api-client";

export function listForms(
  workspaceId: string,
  query: FormListQuery,
): Promise<FormListResponse> {
  const search = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    includeArchived: String(query.includeArchived),
  });

  return getValidated(
    `/workspaces/${workspaceId}/forms?${search.toString()}`,
    formListResponseSchema,
  );
}

export function getForm(formId: string): Promise<FormResponse> {
  return getValidated(`/forms/${formId}`, formResponseSchema);
}

export function createForm(
  workspaceId: string,
  input: CreateFormRequest,
): Promise<FormResponse> {
  return requestValidated(`/workspaces/${workspaceId}/forms`, formResponseSchema, {
    body: input,
    method: "POST",
  });
}

export function renameForm(
  formId: string,
  input: RenameFormRequest,
): Promise<FormResponse> {
  return requestValidated(`/forms/${formId}`, formResponseSchema, {
    body: input,
    method: "PATCH",
  });
}

export function archiveForm(formId: string): Promise<FormResponse> {
  return requestValidated(`/forms/${formId}`, formResponseSchema, {
    method: "DELETE",
  });
}

export function getFormDraft(formId: string): Promise<FormDraftResponse> {
  return getValidated(`/forms/${formId}/draft`, formDraftResponseSchema);
}

export function saveFormDraft(
  formId: string,
  definition: FormDefinition,
): Promise<FormDraftResponse> {
  return requestValidated(`/forms/${formId}/draft`, formDraftResponseSchema, {
    body: definition,
    method: "PUT",
  });
}

export function getFormAccessSettings(formId: string): Promise<FormAccessResponse> {
  return getValidated(`/forms/${formId}/access-settings`, formAccessResponseSchema);
}

export function updateFormAccessSettings(
  formId: string,
  input: FormAccessRequest,
): Promise<FormAccessResponse> {
  return requestValidated(`/forms/${formId}/access-settings`, formAccessResponseSchema, {
    body: input,
    method: "PUT",
  });
}

export function publishForm(formId: string): Promise<FormResponse> {
  return requestValidated(`/forms/${formId}/publish`, formResponseSchema, { method: "POST" });
}

export function unpublishForm(formId: string): Promise<FormResponse> {
  return requestValidated(`/forms/${formId}/publish`, formResponseSchema, { method: "DELETE" });
}
