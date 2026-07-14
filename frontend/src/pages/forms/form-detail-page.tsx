import { useNavigate, useParams } from "react-router-dom";

import {
  useArchiveFormMutation,
  useFormQuery,
} from "../../entities/form/model/form-queries";
import { RenameFormForm } from "../../features/rename-form/components/rename-form-form";

export function FormDetailPage() {
  const { formId = "" } = useParams();
  const navigate = useNavigate();
  const form = useFormQuery(formId);
  const archive = useArchiveFormMutation(formId);

  const handleArchive = async (): Promise<void> => {
    if (form.data === undefined) return;
    const confirmed = window.confirm(
      `Archive “${form.data.data.form.title}”? It will leave the default form list.`,
    );
    if (!confirmed) return;

    try {
      const response = await archive.mutateAsync();
      await navigate(`/workspaces/${response.data.form.workspaceId}/forms`);
    } catch {
      return;
    }
  };

  if (form.isPending) return <section className="state-panel">Loading form…</section>;
  if (form.isError) {
    return <section className="state-panel error-state">Unable to load this form.</section>;
  }

  const currentForm = form.data.data.form;

  return (
    <section aria-labelledby="form-detail-title">
      <p className="eyebrow">{currentForm.status} form</p>
      <h1 id="form-detail-title">{currentForm.title}</h1>
      <p className="section-copy">Stable address: /{currentForm.slug}</p>

      <div className="settings-card">
        <h2>Form details</h2>
        <RenameFormForm formId={currentForm.id} title={currentForm.title} />
      </div>

      <div className="danger-card">
        <h2>Archive form</h2>
        <p>Archived forms are hidden from the default list and cannot be edited.</p>
        <button
          className="danger-button"
          type="button"
          disabled={archive.isPending || currentForm.status === "archived"}
          onClick={() => void handleArchive()}
        >
          {archive.isPending ? "Archiving…" : "Archive form"}
        </button>
        {archive.isError ? <div className="form-alert">Unable to archive this form.</div> : null}
      </div>
    </section>
  );
}
