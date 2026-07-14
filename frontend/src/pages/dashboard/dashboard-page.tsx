import { Link } from "react-router-dom";

import { useWorkspaceListQuery } from "../../entities/workspace/model/workspace-queries";
import { CreateWorkspaceForm } from "../../features/create-workspace/components/create-workspace-form";

export function DashboardPage() {
  const workspaces = useWorkspaceListQuery();

  return (
    <section aria-labelledby="page-title">
      <p className="eyebrow">Workspace overview</p>
      <h1 id="page-title">Your workspaces</h1>
      <p className="section-copy">Create a workspace for each team or project.</p>

      <CreateWorkspaceForm />

      {workspaces.isPending ? <div className="state-panel">Loading workspaces…</div> : null}
      {workspaces.isError ? (
        <div className="state-panel error-state">Unable to load workspaces.</div>
      ) : null}
      {workspaces.data?.data.workspaces.length === 0 ? (
        <div className="empty-state">
          <h2>No workspaces yet</h2>
          <p>Create your first workspace using the form above.</p>
        </div>
      ) : null}
      {workspaces.data === undefined ? null : (
        <ul className="workspace-grid">
          {workspaces.data.data.workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link className="workspace-card" to={`/workspaces/${workspace.id}`}>
                <span>{workspace.name}</span>
                <small>{workspace.role}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
