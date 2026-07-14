import { Link } from "react-router-dom";

import { RegisterForm } from "../../features/authentication/components/register-form";

export function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <Link className="brand" to="/">Formora</Link>
        <p className="eyebrow">Get started</p>
        <h1 id="register-title">Create your account</h1>
        <RegisterForm />
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
