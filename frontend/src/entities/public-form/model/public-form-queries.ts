import { useMutation, useQuery } from "@tanstack/react-query";
import type { SubmissionAnswers } from "../../../shared/api/contracts";
import { getPublicForm, submitPublicForm, unlockPublicForm } from "../api/public-form-api";

export function usePublicFormQuery(slug: string) {
  return useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => getPublicForm(slug),
    retry: false,
  });
}

export function useUnlockPublicFormMutation(slug: string) {
  return useMutation({ mutationFn: (password: string) => unlockPublicForm(slug, password) });
}

export function useSubmitPublicFormMutation(slug: string) {
  return useMutation({
    mutationFn: ({ answers, accessToken }: { answers: SubmissionAnswers; accessToken?: string }) =>
      submitPublicForm(slug, answers, accessToken),
  });
}
