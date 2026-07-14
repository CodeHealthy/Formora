import {
  managedSubmissionListResponseSchema,
  managedSubmissionResponseSchema,
  type ManagedSubmissionListQuery,
  type ManagedSubmissionListResponse,
  type ManagedSubmissionResponse,
} from "../../../shared/api/contracts";
import { getValidated } from "../../../shared/api/api-client";
import { ApiError } from "../../../shared/api/api-error";
import { webEnvironment } from "../../../shared/config/environment";

function queryString(query: ManagedSubmissionListQuery): string {
  const search = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.publicationVersion !== undefined) {
    search.set("publicationVersion", String(query.publicationVersion));
  }
  if (query.from !== undefined) search.set("from", query.from);
  if (query.to !== undefined) search.set("to", query.to);
  return search.toString();
}

export function listFormSubmissions(
  formId: string,
  query: ManagedSubmissionListQuery,
): Promise<ManagedSubmissionListResponse> {
  return getValidated(
    `/forms/${formId}/submissions?${queryString(query)}`,
    managedSubmissionListResponseSchema,
  );
}

export function getFormSubmission(
  formId: string,
  submissionId: string,
): Promise<ManagedSubmissionResponse> {
  return getValidated(
    `/forms/${formId}/submissions/${submissionId}`,
    managedSubmissionResponseSchema,
  );
}

export async function downloadSubmissionCsv(
  formId: string,
  publicationVersion: number,
  from?: string,
  to?: string,
): Promise<{ blob: Blob; filename: string }> {
  const search = new URLSearchParams({ publicationVersion: String(publicationVersion) });
  if (from !== undefined) search.set("from", from);
  if (to !== undefined) search.set("to", to);
  const response = await fetch(
    `${webEnvironment.VITE_API_BASE_URL}/forms/${formId}/submissions/export?${search.toString()}`,
    { credentials: "include", headers: { accept: "text/csv" } },
  );
  if (!response.ok) {
    throw new ApiError("The response export failed.", response.status, "EXPORT_FAILED");
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "form-responses.csv";
  return { blob: await response.blob(), filename };
}
