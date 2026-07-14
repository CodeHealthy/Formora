import { Navigate, Outlet, useLocation } from "react-router-dom";

import { ApiError } from "../../../shared/api/api-error";
import { useSessionQuery } from "../model/auth-queries";

export function ProtectedRoute() {
  const location = useLocation();
  const session = useSessionQuery();

  if (session.isPending) {
    return <main className="centered-page">Checking your session…</main>;
  }

  if (session.error instanceof ApiError && session.error.statusCode === 401) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (session.isError) {
    return (
      <main className="centered-page">
        <section className="status-card">
          <h1>Unable to verify your session</h1>
          <p>Check your connection and try again.</p>
          <button className="primary-button" type="button" onClick={() => void session.refetch()}>
            Try again
          </button>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
