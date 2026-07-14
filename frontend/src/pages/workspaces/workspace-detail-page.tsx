import { Link, useParams } from "react-router-dom";

import { useWorkspaceQuery } from "../../entities/workspace/model/workspace-queries";

export function WorkspaceDetailPage() {
  const { workspaceId = "" } = useParams();
  const workspace = useWorkspaceQuery(workspaceId);

  if (workspace.isPending) {
    return <section className="state-panel">Loading workspace…</section>;
  }

  if (workspace.isError) {
    return <section className="state-panel error-state">Unable to load this workspace.</section>;
  }

  return (
    <section aria-labelledby="workspace-title">
      <p className="eyebrow">{workspace.data.data.workspace.role} workspace</p>
      <h1 id="workspace-title">{workspace.data.data.workspace.name}</h1>
      <div className="empty-state">
        <h2>No forms yet</h2>
        <p>Create and manage the forms owned by this workspace.</p>
        <Link className="primary-link" to={`/workspaces/${workspaceId}/forms`}>
          Manage forms
        </Link>
      </div>
    </section>
  );
}
