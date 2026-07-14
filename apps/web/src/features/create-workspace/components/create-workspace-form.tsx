import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWorkspaceRequestSchema,
  type CreateWorkspaceRequest,
} from "@formora/contracts";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useCreateWorkspaceMutation } from "../../../entities/workspace/model/workspace-queries";
import { ApiError } from "../../../shared/api/api-error";

export function CreateWorkspaceForm() {
  const navigate = useNavigate();
  const mutation = useCreateWorkspaceMutation();
  const form = useForm<CreateWorkspaceRequest>({
    resolver: zodResolver(createWorkspaceRequestSchema),
    defaultValues: { name: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const response = await mutation.mutateAsync(input);
      await navigate(`/workspaces/${response.data.workspace.id}`);
    } catch {
      return;
    }
  });
  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? "Unable to create the workspace. Please try again."
        : null;

  return (
    <form className="inline-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="field-group">
        <label htmlFor="workspace-name">Workspace name</label>
        <input id="workspace-name" placeholder="Acme team" {...form.register("name")} />
        <span className="field-error">{form.formState.errors.name?.message}</span>
      </div>
      <button className="primary-button" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating…" : "Create workspace"}
      </button>
      {errorMessage === null ? null : <div className="form-alert">{errorMessage}</div>}
    </form>
  );
}
