import { useState } from "react";

import {
  usePublishFormMutation,
  useUnpublishFormMutation,
} from "../../../entities/form/model/form-queries";
import type { FormResponse } from "../../../shared/api/contracts";

type ManagedForm = FormResponse["data"]["form"];

export function FormPublicationSettings({ form }: { form: ManagedForm }) {
  const publish = usePublishFormMutation(form.id);
  const unpublish = useUnpublishFormMutation(form.id);
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/f/${form.slug}`;

  const copyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
  };

  const handleUnpublish = async (): Promise<void> => {
    if (!window.confirm("Unpublish this form? Guests will no longer be able to open it.")) return;
    try {
      await unpublish.mutateAsync();
    } catch {
      return;
    }
  };

  return (
    <div className="publication-settings">
      {form.status === "published" ? (
        <div className="published-link">
          <span>Public form URL</span>
          <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a>
          <button className="secondary-button" type="button" onClick={() => void copyLink()}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : (
        <p>Publish a snapshot before sharing this form with guests.</p>
      )}

      <div className="builder-header-actions publication-actions">
        <button
          className="primary-button"
          type="button"
          disabled={form.status === "archived" || publish.isPending}
          onClick={() => void publish.mutateAsync()}
        >
          {publish.isPending
            ? "Publishing..."
            : form.status === "published" ? "Publish latest draft" : "Publish form"}
        </button>
        {form.status === "published" ? (
          <button
            className="secondary-button"
            type="button"
            disabled={unpublish.isPending}
            onClick={() => void handleUnpublish()}
          >
            {unpublish.isPending ? "Unpublishing..." : "Unpublish"}
          </button>
        ) : null}
      </div>
      {publish.isError ? <div className="form-alert">Unable to publish. Add at least one valid field and check guest access settings.</div> : null}
      {unpublish.isError ? <div className="form-alert">Unable to unpublish this form.</div> : null}
    </div>
  );
}
