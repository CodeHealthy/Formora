import { zodResolver } from "@hookform/resolvers/zod";
import { registerRequestSchema, type RegisterRequest } from "@formora/contracts";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../shared/api/api-error";
import { useRegisterMutation } from "../model/auth-queries";

export function RegisterForm() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const submit = form.handleSubmit(async (input) => {
    try {
      await registerMutation.mutateAsync(input);
      await navigate("/");
    } catch {
      return;
    }
  });
  const errorMessage =
    registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : registerMutation.isError
        ? "Unable to create your account. Please try again."
        : null;

  return (
    <form className="auth-form" onSubmit={(event) => void submit(event)} noValidate>
      {errorMessage === null ? null : <div className="form-alert">{errorMessage}</div>}
      <label>
        Name
        <input autoComplete="name" {...form.register("displayName")} />
        <span className="field-error">{form.formState.errors.displayName?.message}</span>
      </label>
      <label>
        Email address
        <input type="email" autoComplete="email" {...form.register("email")} />
        <span className="field-error">{form.formState.errors.email?.message}</span>
      </label>
      <label>
        Password
        <input type="password" autoComplete="new-password" {...form.register("password")} />
        <span className="field-hint">Use at least 12 characters.</span>
        <span className="field-error">{form.formState.errors.password?.message}</span>
      </label>
      <button className="primary-button" type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
