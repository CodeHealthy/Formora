import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import {
  usePublicFormQuery,
  useSubmitPublicFormMutation,
  useUnlockPublicFormMutation,
} from "../../entities/public-form/model/public-form-queries";
import type { FormDefinition, FormField, PublicForm, SubmissionAnswers } from "../../shared/api/contracts";

export function PublicFormPage() {
  const { slug = "" } = useParams();
  const publicForm = usePublicFormQuery(slug);
  const unlock = useUnlockPublicFormMutation(slug);
  const submit = useSubmitPublicFormMutation(slug);
  const [password, setPassword] = useState("");
  const [unlockedForm, setUnlockedForm] = useState<PublicForm | null>(null);
  const [accessToken, setAccessToken] = useState<string>();

  if (publicForm.isPending) {
    return <PublicShell><div className="public-state">Loading form...</div></PublicShell>;
  }
  if (publicForm.isError) {
    return (
      <PublicShell>
        <div className="public-state">
          <h1>This form is not available</h1>
          <p>Check the link with the person who shared it with you.</p>
        </div>
      </PublicShell>
    );
  }

  const form = unlockedForm ?? publicForm.data.data.form;

  const handleUnlock = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      const response = await unlock.mutateAsync(password);
      setUnlockedForm(response.data.form);
      setAccessToken(response.data.accessToken);
      setPassword("");
    } catch {
      return;
    }
  };

  if (form.definition === null) {
    return (
      <PublicShell>
        <div className="public-form-card password-card">
          <p className="eyebrow">Password protected</p>
          <h1>{form.title}</h1>
          <p>Enter the password provided by the form owner.</p>
          <form onSubmit={(event) => void handleUnlock(event)}>
            <label>Form password
              <input
                type="password"
                required
                maxLength={128}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="primary-button" type="submit" disabled={unlock.isPending}>
              {unlock.isPending ? "Checking..." : "Open form"}
            </button>
            {unlock.isError ? <div className="form-alert">The password is incorrect or access has expired.</div> : null}
          </form>
        </div>
      </PublicShell>
    );
  }

  if (submit.isSuccess) {
    return (
      <PublicShell>
        <div className="public-state submission-success">
          <h1>Response submitted</h1>
          <p>Your response has been securely received.</p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="public-form-card">
        <p className="eyebrow">Formora form</p>
        <h1>{form.title}</h1>
        <p className="public-form-intro">Complete the fields below and submit your response.</p>
        <GuestResponseForm
          definition={form.definition}
          pending={submit.isPending}
          onSubmit={(answers) => submit.mutate({ answers, accessToken })}
        />
        {submit.isError ? <div className="form-alert">Your response could not be submitted. Check the answers and try again.</div> : null}
      </div>
    </PublicShell>
  );
}

function GuestResponseForm({
  definition,
  pending,
  onSubmit,
}: {
  definition: FormDefinition;
  pending: boolean;
  onSubmit: (answers: SubmissionAnswers) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const answers: SubmissionAnswers = {};
    for (const field of definition.fields) {
      if (field.type === "checkbox") {
        answers[field.id] = formData.has(field.id);
        continue;
      }
      const rawValue = formData.get(field.id);
      if (typeof rawValue !== "string" || rawValue === "") continue;
      answers[field.id] = field.type === "number" ? Number(rawValue) : rawValue;
    }
    onSubmit(answers);
  };

  return (
    <form className="guest-response-form" onSubmit={handleSubmit}>
      {definition.fields.map((field) => <GuestField key={field.id} field={field} />)}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit response"}
      </button>
    </form>
  );
}

function GuestField({ field }: { field: FormField }) {
  const label = <span>{field.label}{field.required ? <strong aria-label="required"> *</strong> : null}</span>;
  if (field.type === "checkbox") {
    return <label className="public-checkbox"><input name={field.id} type="checkbox" required={field.required} />{label}</label>;
  }
  if (field.type === "textarea") {
    return <label>{label}<textarea name={field.id} rows={5} maxLength={10_000} required={field.required} placeholder={field.placeholder} /></label>;
  }
  if (field.type === "select") {
    return (
      <label>{label}<select name={field.id} required={field.required} defaultValue="">
        <option value="" disabled={field.required}>Select an option</option>
        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select></label>
    );
  }
  return <label>{label}<input name={field.id} type={field.type} maxLength={field.type === "number" ? undefined : 10_000} required={field.required} placeholder={field.placeholder} /></label>;
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className="public-form-shell">
      <Link className="brand" to="/" aria-label="Formora home">Formora</Link>
      {children}
      <p className="public-footer">Securely powered by Formora</p>
    </main>
  );
}
