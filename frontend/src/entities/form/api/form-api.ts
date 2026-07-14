import {
  formListResponseSchema,
  formResponseSchema,
  type CreateFormRequest,
  type FormListQuery,
  type FormListResponse,
  type FormResponse,
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
