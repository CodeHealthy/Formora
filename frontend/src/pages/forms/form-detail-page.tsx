import { Link, useNavigate, useParams } from "react-router-dom";

import {
  useArchiveFormMutation,
  useFormQuery,
} from "../../entities/form/model/form-queries";
import { RenameFormForm } from "../../features/rename-form/components/rename-form-form";
import { FormAccessSettings } from "../../features/form-access/components/form-access-settings";
import { FormPublicationSettings } from "../../features/form-publication/components/form-publication-settings";

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

      {currentForm.status !== "archived" ? (
        <Link className="primary-link form-builder-link" to={`/forms/${currentForm.id}/builder`}>
          Build form
        </Link>
      ) : null}
      <Link className="secondary-link form-builder-link" to={`/forms/${currentForm.id}/responses`}>
        View responses
      </Link>

      <div className="settings-card">
        <h2>Form details</h2>
        <RenameFormForm formId={currentForm.id} title={currentForm.title} />
      </div>

      <div className="settings-card">
        <h2>Guest access</h2>
        <p>Choose how guests will open and submit this form once it is published.</p>
        <FormAccessSettings formId={currentForm.id} archived={currentForm.status === "archived"} />
      </div>

      <div className="settings-card">
        <h2>Publish and share</h2>
        <FormPublicationSettings form={currentForm} />
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
