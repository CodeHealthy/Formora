import { Link, useParams, useSearchParams } from "react-router-dom";

import { useFormListQuery } from "../../entities/form/model/form-queries";
import { useWorkspaceQuery } from "../../entities/workspace/model/workspace-queries";
import { CreateFormForm } from "../../features/create-form/components/create-form-form";

const pageSize = 12;

export function WorkspaceFormsPage() {
  const { workspaceId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const includeArchived = searchParams.get("includeArchived") === "true";
  const workspace = useWorkspaceQuery(workspaceId);
  const forms = useFormListQuery(workspaceId, { page, pageSize, includeArchived });

  const updateFilters = (next: { page?: number; includeArchived?: boolean }): void => {
    const nextPage = next.page ?? page;
    const nextArchived = next.includeArchived ?? includeArchived;
    setSearchParams({
      ...(nextPage > 1 ? { page: String(nextPage) } : {}),
      ...(nextArchived ? { includeArchived: "true" } : {}),
    });
  };

  return (
    <section aria-labelledby="workspace-forms-title">
      <p className="eyebrow">{workspace.data?.data.workspace.name ?? "Workspace"}</p>
      <h1 id="workspace-forms-title">Forms</h1>
      <p className="section-copy">Create and manage forms in this workspace.</p>

      <CreateFormForm workspaceId={workspaceId} />

      <label className="filter-control">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(event) =>
            updateFilters({ page: 1, includeArchived: event.currentTarget.checked })
          }
        />
        Include archived forms
      </label>

      {forms.isPending ? <div className="state-panel">Loading forms…</div> : null}
      {forms.isError ? (
        <div className="state-panel error-state">Unable to load forms.</div>
      ) : null}
      {forms.data?.data.forms.length === 0 ? (
        <div className="empty-state">
          <h2>No forms found</h2>
          <p>
            {includeArchived
              ? "This workspace does not contain any forms."
              : "Create the first form using the title field above."}
          </p>
        </div>
      ) : null}
      {forms.data === undefined ? null : (
        <ul className="form-grid">
          {forms.data.data.forms.map((form) => (
            <li key={form.id}>
              <Link className="form-card" to={`/forms/${form.id}`}>
                <span>{form.title}</span>
                <small className={`status-badge ${form.status}`}>{form.status}</small>
                <small>/{form.slug}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {forms.data !== undefined && forms.data.meta.totalPages > 1 ? (
        <nav className="pagination" aria-label="Form list pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => updateFilters({ page: page - 1 })}
          >
            Previous
          </button>
          <span>
            Page {page} of {forms.data.meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= forms.data.meta.totalPages}
            onClick={() => updateFilters({ page: page + 1 })}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
