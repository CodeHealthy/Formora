import { Link, useParams } from "react-router-dom";
import { useSubmissionQuery } from "../../entities/submission/model/submission-queries";

export function SubmissionDetailPage() {
  const { formId = "", submissionId = "" } = useParams();
  const submission = useSubmissionQuery(formId, submissionId);

  if (submission.isPending) return <section className="state-panel">Loading response...</section>;
  if (submission.isError) return <section className="state-panel error-state">Unable to load this response.</section>;

  const detail = submission.data.data.submission;
  return (
    <section aria-labelledby="submission-title">
      <Link className="builder-back-link" to={`/forms/${formId}/responses`}>Back to responses</Link>
      <p className="eyebrow">Publication version {detail.publicationVersion}</p>
      <h1 id="submission-title" className="responses-title">Response details</h1>
      <p className="section-copy">Submitted {formatDate(detail.submittedAt)}</p>

      <div className="answer-list">
        {detail.answers.map((answer) => (
          <article key={answer.fieldId}>
            <h2>{answer.label}</h2>
            <p>{answer.answered ? displayValue(answer.value) : <span className="no-answer">No answer</span>}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function displayValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}
