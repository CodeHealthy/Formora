import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export interface ApplicationErrorPageProps {
  notFound?: boolean;
}

export function ApplicationErrorPage({ notFound = false }: ApplicationErrorPageProps) {
  const error = useRouteError();
  const isNotFound = notFound || (isRouteErrorResponse(error) && error.status === 404);

  return (
    <main className="centered-page">
      <section className="status-card" aria-labelledby="error-title">
        <p className="eyebrow">{isNotFound ? "404" : "Unexpected error"}</p>
        <h1 id="error-title">
          {isNotFound ? "This page does not exist" : "Something went wrong"}
        </h1>
        <p>
          {isNotFound
            ? "The address may be incorrect or the page may have moved."
            : "Please return to the overview and try again."}
        </p>
        <Link className="primary-link" to="/">
          Return to overview
        </Link>
      </section>
    </main>
  );
}
