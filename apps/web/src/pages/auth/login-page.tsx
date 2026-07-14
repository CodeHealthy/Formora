import { Link } from "react-router-dom";

import { LoginForm } from "../../features/authentication/components/login-form";

export function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="brand" to="/">Formora</Link>
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-title">Sign in to Formora</h1>
        <LoginForm />
        <p className="auth-switch">New to Formora? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  );
}
