import { Link } from "react-router-dom";

import { useWorkspaceListQuery } from "../../entities/workspace/model/workspace-queries";

export function FormsPage() {
  const workspaces = useWorkspaceListQuery();

  return (
    <section aria-labelledby="forms-title">
      <p className="eyebrow">Forms</p>
      <h1 id="forms-title">Choose a workspace</h1>
      <p className="section-copy">Forms are organized and authorized by workspace.</p>

      {workspaces.isPending ? <div className="state-panel">Loading workspaces…</div> : null}
      {workspaces.isError ? (
        <div className="state-panel error-state">Unable to load workspaces.</div>
      ) : null}
      {workspaces.data?.data.workspaces.length === 0 ? (
        <div className="empty-state">
          <h2>No workspaces yet</h2>
          <p>Create a workspace from the overview before adding forms.</p>
        </div>
      ) : null}
      {workspaces.data === undefined ? null : (
        <ul className="workspace-grid">
          {workspaces.data.data.workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link className="workspace-card" to={`/workspaces/${workspace.id}/forms`}>
                <span>{workspace.name}</span>
                <small>Manage forms</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
