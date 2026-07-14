import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { useFormQuery } from "../../entities/form/model/form-queries";
import { downloadSubmissionCsv } from "../../entities/submission/api/submission-api";
import { useSubmissionListQuery } from "../../entities/submission/model/submission-queries";
import type { ManagedSubmissionListQuery } from "../../shared/api/contracts";

export function FormResponsesPage() {
  const { formId = "" } = useParams();
  const form = useFormQuery(formId);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState<number>();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filters, setFilters] = useState<Pick<ManagedSubmissionListQuery, "from" | "to">>({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const submissions = useSubmissionListQuery(formId, {
    page,
    pageSize: 20,
    publicationVersion: version,
    ...filters,
  });

  const applyDateFilters = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFilters({
      from: fromDate === "" ? undefined : new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
      to: toDate === "" ? undefined : new Date(`${toDate}T23:59:59.999Z`).toISOString(),
    });
    setPage(1);
  };

  const exportCsv = async (): Promise<void> => {
    if (version === undefined) return;
    setExporting(true);
    setExportError(false);
    try {
      const file = await downloadSubmissionCsv(formId, version, filters.from, filters.to);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  if (form.isPending || submissions.isPending) {
    return <section className="state-panel">Loading responses...</section>;
  }
  if (form.isError || submissions.isError) {
    return <section className="state-panel error-state">Unable to load form responses.</section>;
  }

  const currentForm = form.data.data.form;
  const responseData = submissions.data;

  return (
    <section aria-labelledby="responses-title">
      <Link className="builder-back-link" to={`/forms/${formId}`}>Back to form details</Link>
      <p className="eyebrow">{currentForm.title}</p>
      <h1 id="responses-title" className="responses-title">Responses</h1>
      <p className="section-copy">{responseData.meta.totalItems} submitted responses</p>

      <div className="response-toolbar">
        <label>Publication version
          <select
            value={version ?? ""}
            onChange={(event) => {
              setVersion(event.target.value === "" ? undefined : Number(event.target.value));
              setPage(1);
            }}
          >
            <option value="">All versions</option>
            {responseData.meta.availableVersions.map((item) => (
              <option key={item} value={item}>Version {item}</option>
            ))}
          </select>
        </label>
        <form className="response-date-filter" onSubmit={applyDateFilters}>
          <label>From<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label>To<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
          <button className="secondary-button" type="submit">Apply dates</button>
        </form>
        <button
          className="primary-button"
          type="button"
          disabled={version === undefined || exporting}
          title={version === undefined ? "Select a publication version to export" : undefined}
          onClick={() => void exportCsv()}
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
      {exportError ? <div className="form-alert">The CSV export could not be downloaded.</div> : null}

      {responseData.data.submissions.length === 0 ? (
        <div className="empty-state response-empty">
          <h2>No responses found</h2>
          <p>Responses will appear here after guests submit the published form.</p>
        </div>
      ) : (
        <div className="response-table-wrap">
          <table className="response-table">
            <thead><tr><th>Submitted</th><th>Version</th><th>Answered fields</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {responseData.data.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{formatDate(submission.submittedAt)}</td>
                  <td>Version {submission.publicationVersion}</td>
                  <td>{submission.answeredFields}</td>
                  <td><Link to={`/forms/${formId}/responses/${submission.id}`}>View response</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {responseData.meta.totalPages > 1 ? (
        <nav className="pagination" aria-label="Response pages">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {responseData.meta.totalPages}</span>
          <button type="button" disabled={page >= responseData.meta.totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      ) : null}
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
