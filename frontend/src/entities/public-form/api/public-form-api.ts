import {
  publicFormAccessResponseSchema,
  publicFormResponseSchema,
  submissionResponseSchema,
  type PublicFormAccessResponse,
  type PublicFormResponse,
  type SubmissionAnswers,
  type SubmissionResponse,
} from "../../../shared/api/contracts";
import { getValidated, requestValidated } from "../../../shared/api/api-client";

export function getPublicForm(slug: string): Promise<PublicFormResponse> {
  return getValidated(`/public/forms/${slug}`, publicFormResponseSchema);
}

export function unlockPublicForm(slug: string, password: string): Promise<PublicFormAccessResponse> {
  return requestValidated(`/public/forms/${slug}/access`, publicFormAccessResponseSchema, {
    body: { password },
    method: "POST",
  });
}

export function submitPublicForm(
  slug: string,
  answers: SubmissionAnswers,
  accessToken?: string,
): Promise<SubmissionResponse> {
  return requestValidated(`/public/forms/${slug}/submissions`, submissionResponseSchema, {
    body: { answers },
    headers: accessToken === undefined ? {} : { "X-Form-Access-Token": accessToken },
    method: "POST",
  });
}
