import { zodResolver } from "@hookform/resolvers/zod";
import { createFormRequestSchema, type CreateFormRequest } from "../../../shared/api/contracts";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useCreateFormMutation } from "../../../entities/form/model/form-queries";
import { ApiError } from "../../../shared/api/api-error";

export function CreateFormForm({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate();
  const mutation = useCreateFormMutation(workspaceId);
  const form = useForm<CreateFormRequest>({
    resolver: zodResolver(createFormRequestSchema),
    defaultValues: { title: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const response = await mutation.mutateAsync(input);
      await navigate(`/forms/${response.data.form.id}`);
    } catch {
      return;
    }
  });
  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? "Unable to create the form. Please try again."
        : null;

  return (
    <form className="inline-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="field-group">
        <label htmlFor="form-title">Form title</label>
        <input id="form-title" placeholder="Customer feedback" {...form.register("title")} />
        <span className="field-error">{form.formState.errors.title?.message}</span>
      </div>
      <button className="primary-button" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating…" : "Create form"}
      </button>
      {errorMessage === null ? null : <div className="form-alert">{errorMessage}</div>}
    </form>
  );
}
