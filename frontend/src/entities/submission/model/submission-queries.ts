import { useQuery } from "@tanstack/react-query";
import type { ManagedSubmissionListQuery } from "../../../shared/api/contracts";
import { getFormSubmission, listFormSubmissions } from "../api/submission-api";

export const submissionKeys = {
  all: (formId: string) => ["submissions", formId] as const,
  list: (formId: string, query: ManagedSubmissionListQuery) =>
    ["submissions", formId, "list", query] as const,
  detail: (formId: string, submissionId: string) =>
    ["submissions", formId, "detail", submissionId] as const,
};

export function useSubmissionListQuery(formId: string, query: ManagedSubmissionListQuery) {
  return useQuery({
    queryKey: submissionKeys.list(formId, query),
    queryFn: () => listFormSubmissions(formId, query),
  });
}

export function useSubmissionQuery(formId: string, submissionId: string) {
  return useQuery({
    queryKey: submissionKeys.detail(formId, submissionId),
    queryFn: () => getFormSubmission(formId, submissionId),
  });
}
