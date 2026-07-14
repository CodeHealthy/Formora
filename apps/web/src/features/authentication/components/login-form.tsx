import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequestSchema, type LoginRequest } from "@formora/contracts";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../shared/api/api-error";
import { useLoginMutation } from "../model/auth-queries";

export function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit(async (input) => {
    try {
      await loginMutation.mutateAsync(input);
      await navigate("/");
    } catch {
      return;
    }
  });
  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? "Unable to sign in. Please try again."
        : null;

  return (
    <form className="auth-form" onSubmit={(event) => void submit(event)} noValidate>
      {errorMessage === null ? null : <div className="form-alert">{errorMessage}</div>}
      <label>
        Email address
        <input type="email" autoComplete="email" {...form.register("email")} />
        <span className="field-error">{form.formState.errors.email?.message}</span>
      </label>
      <label>
        Password
        <input type="password" autoComplete="current-password" {...form.register("password")} />
        <span className="field-error">{form.formState.errors.password?.message}</span>
      </label>
      <button className="primary-button" type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
