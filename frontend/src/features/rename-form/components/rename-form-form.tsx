import { zodResolver } from "@hookform/resolvers/zod";
import { renameFormRequestSchema, type RenameFormRequest } from "../../../shared/api/contracts";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useRenameFormMutation } from "../../../entities/form/model/form-queries";
import { ApiError } from "../../../shared/api/api-error";

export interface RenameFormFormProps {
  formId: string;
  title: string;
}

export function RenameFormForm({ formId, title }: RenameFormFormProps) {
  const mutation = useRenameFormMutation(formId);
  const form = useForm<RenameFormRequest>({
    resolver: zodResolver(renameFormRequestSchema),
    defaultValues: { title },
  });

  useEffect(() => {
    form.reset({ title });
  }, [form, title]);

  const submit = form.handleSubmit(async (input) => {
    try {
      await mutation.mutateAsync(input);
    } catch {
      return;
    }
  });
  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? "Unable to rename the form."
        : null;

  return (
    <form className="settings-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="field-group">
        <label htmlFor="rename-form-title">Form title</label>
        <input id="rename-form-title" {...form.register("title")} />
        <span className="field-error">{form.formState.errors.title?.message}</span>
      </div>
      <button className="secondary-button" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Save title"}
      </button>
      {errorMessage === null ? null : <div className="form-alert">{errorMessage}</div>}
    </form>
  );
}
