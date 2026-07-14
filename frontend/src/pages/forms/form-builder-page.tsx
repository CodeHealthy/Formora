import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useParams } from "react-router-dom";

import {
  useFormDraftQuery,
  useFormQuery,
  useSaveFormDraftMutation,
} from "../../entities/form/model/form-queries";
import type {
  FormDefinition,
  FormField,
  FormFieldType,
} from "../../shared/api/contracts";

const FIELD_TYPES: ReadonlyArray<{ type: FormFieldType; label: string; description: string }> = [
  { type: "text", label: "Short text", description: "Names and brief answers" },
  { type: "textarea", label: "Long text", description: "Comments and detailed answers" },
  { type: "email", label: "Email", description: "Validated email addresses" },
  { type: "number", label: "Number", description: "Numeric answers" },
  { type: "select", label: "Dropdown", description: "One choice from a list" },
  { type: "checkbox", label: "Checkbox", description: "Consent and confirmations" },
];

function createField(type: FormFieldType): FormField {
  const definition = FIELD_TYPES.find((item) => item.type === type);
  return {
    id: crypto.randomUUID(),
    type,
    label: definition?.label ?? "Question",
    required: false,
    placeholder: "",
    options: type === "select" ? ["Option 1", "Option 2"] : [],
  };
}

export function FormBuilderPage() {
  const { formId = "" } = useParams();
  const form = useFormQuery(formId);
  const draft = useFormDraftQuery(formId);
  const saveDraft = useSaveFormDraftMutation(formId);
  const [definition, setDefinition] = useState<FormDefinition>({ schemaVersion: 1, fields: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const initializedFormId = useRef<string | null>(null);
  const blocker = useBlocker(dirty);

  useEffect(() => {
    if (draft.data === undefined || initializedFormId.current === formId) return;
    const loaded = draft.data.data.draft;
    setDefinition({ schemaVersion: 1, fields: loaded.fields });
    setSelectedId(loaded.fields[0]?.id ?? null);
    initializedFormId.current = formId;
  }, [draft.data, formId]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  const selectedField = useMemo(
    () => definition.fields.find((field) => field.id === selectedId) ?? null,
    [definition.fields, selectedId],
  );

  const replaceFields = (fields: FormField[]): void => {
    setDefinition({ schemaVersion: 1, fields });
    setDirty(true);
  };

  const addField = (type: FormFieldType): void => {
    if (definition.fields.length >= 100) return;
    const field = createField(type);
    replaceFields([...definition.fields, field]);
    setSelectedId(field.id);
    setPreview(false);
  };

  const updateField = (changes: Partial<FormField>): void => {
    if (selectedField === null) return;
    replaceFields(
      definition.fields.map((field) =>
        field.id === selectedField.id ? { ...field, ...changes } : field,
      ),
    );
  };

  const removeField = (fieldId: string): void => {
    const index = definition.fields.findIndex((field) => field.id === fieldId);
    const fields = definition.fields.filter((field) => field.id !== fieldId);
    replaceFields(fields);
    setSelectedId(fields[Math.min(index, fields.length - 1)]?.id ?? null);
  };

  const duplicateField = (field: FormField): void => {
    if (definition.fields.length >= 100) return;
    const duplicate = { ...field, id: crypto.randomUUID(), label: `${field.label} copy` };
    const index = definition.fields.findIndex((item) => item.id === field.id);
    const fields = [...definition.fields];
    fields.splice(index + 1, 0, duplicate);
    replaceFields(fields);
    setSelectedId(duplicate.id);
  };

  const moveField = (index: number, offset: -1 | 1): void => {
    const destination = index + offset;
    if (destination < 0 || destination >= definition.fields.length) return;
    const fields = [...definition.fields];
    [fields[index], fields[destination]] = [fields[destination], fields[index]];
    replaceFields(fields);
  };

  const handleSave = async (): Promise<void> => {
    try {
      const response = await saveDraft.mutateAsync(definition);
      setDefinition({ schemaVersion: 1, fields: response.data.draft.fields });
      setDirty(false);
    } catch {
      return;
    }
  };

  if (form.isPending || draft.isPending) {
    return <section className="state-panel">Loading form builder...</section>;
  }
  if (form.isError || draft.isError) {
    return <section className="state-panel error-state">Unable to load the form builder.</section>;
  }

  const currentForm = form.data.data.form;
  const archived = currentForm.status === "archived";

  return (
    <section className="builder-page" aria-labelledby="builder-title">
      <header className="builder-header">
        <div>
          <Link className="builder-back-link" to={`/forms/${formId}`}>Back to form details</Link>
          <h1 id="builder-title">{currentForm.title}</h1>
          <span className={`save-status ${dirty ? "unsaved" : ""}`}>
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>
        <div className="builder-header-actions">
          <button className="secondary-button" type="button" onClick={() => setPreview(!preview)}>
            {preview ? "Edit form" : "Preview"}
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!dirty || saveDraft.isPending || archived}
            onClick={() => void handleSave()}
          >
            {saveDraft.isPending ? "Saving..." : "Save draft"}
          </button>
        </div>
      </header>

      {archived ? <div className="form-alert">Archived forms are read-only.</div> : null}
      {saveDraft.isError ? (
        <div className="form-alert">The draft could not be saved. Review the field settings and try again.</div>
      ) : null}

      {preview ? (
        <div className="preview-area">
          <div className="preview-toolbar" aria-label="Preview size">
            <button className={!mobilePreview ? "active" : ""} type="button" onClick={() => setMobilePreview(false)}>
              Desktop
            </button>
            <button className={mobilePreview ? "active" : ""} type="button" onClick={() => setMobilePreview(true)}>
              Mobile
            </button>
          </div>
          <div className={`form-preview ${mobilePreview ? "mobile" : ""}`}>
            <h2>{currentForm.title}</h2>
            <p>Preview of the form your clients will see.</p>
            <form onSubmit={(event) => event.preventDefault()}>
              {definition.fields.map((field) => <PreviewField key={field.id} field={field} />)}
              {definition.fields.length === 0 ? <div className="builder-empty">Add fields to preview your form.</div> : null}
              {definition.fields.length > 0 ? <button className="primary-button" type="submit">Submit</button> : null}
            </form>
          </div>
        </div>
      ) : (
        <div className="builder-grid">
          <aside className="builder-panel palette-panel" aria-labelledby="field-palette-title">
            <h2 id="field-palette-title">Add a field</h2>
            <p>Choose the answer format you need.</p>
            <div className="field-palette">
              {FIELD_TYPES.map((item) => (
                <button key={item.type} type="button" disabled={archived} onClick={() => addField(item.type)}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="builder-panel canvas-panel" aria-labelledby="form-canvas-title">
            <div className="builder-panel-heading">
              <div>
                <h2 id="form-canvas-title">Form fields</h2>
                <p>{definition.fields.length} of 100 fields</p>
              </div>
            </div>
            {definition.fields.length === 0 ? (
              <div className="builder-empty">
                <h3>Start with your first question</h3>
                <p>Select a field type from the panel on the left.</p>
              </div>
            ) : (
              <ol className="canvas-fields">
                {definition.fields.map((field, index) => (
                  <li key={field.id} className={selectedId === field.id ? "selected" : ""}>
                    <button className="field-summary" type="button" onClick={() => setSelectedId(field.id)}>
                      <span>{index + 1}</span>
                      <span><strong>{field.label}</strong><small>{FIELD_TYPES.find((item) => item.type === field.type)?.label}</small></span>
                    </button>
                    <div className="field-actions" aria-label={`Actions for ${field.label}`}>
                      <button type="button" title="Move up" disabled={archived || index === 0} onClick={() => moveField(index, -1)}>Up</button>
                      <button type="button" title="Move down" disabled={archived || index === definition.fields.length - 1} onClick={() => moveField(index, 1)}>Down</button>
                      <button type="button" disabled={archived} onClick={() => duplicateField(field)}>Duplicate</button>
                      <button className="remove-action" type="button" disabled={archived} onClick={() => removeField(field.id)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </main>

          <aside className="builder-panel settings-panel" aria-labelledby="field-settings-title">
            <h2 id="field-settings-title">Field settings</h2>
            {selectedField === null ? (
              <p>Select a field to edit its content and behavior.</p>
            ) : (
              <FieldSettings field={selectedField} disabled={archived} onChange={updateField} />
            )}
          </aside>
        </div>
      )}

      {blocker.state === "blocked" ? (
        <div className="unsaved-dialog" role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title">
          <div>
            <h2 id="unsaved-title">Leave without saving?</h2>
            <p>Your latest form changes will be lost.</p>
            <div className="builder-header-actions">
              <button className="secondary-button" type="button" onClick={() => blocker.reset()}>Stay here</button>
              <button className="danger-button" type="button" onClick={() => blocker.proceed()}>Leave page</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FieldSettings({
  field,
  disabled,
  onChange,
}: {
  field: FormField;
  disabled: boolean;
  onChange: (changes: Partial<FormField>) => void;
}) {
  return (
    <div className="field-settings-form">
      <label>Field type
        <select
          value={field.type}
          disabled={disabled}
          onChange={(event) => {
            const type = event.target.value as FormFieldType;
            onChange({ type, options: type === "select" ? ["Option 1", "Option 2"] : [] });
          }}
        >
          {FIELD_TYPES.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
        </select>
      </label>
      <label>Question label
        <input maxLength={120} value={field.label} disabled={disabled} onChange={(event) => onChange({ label: event.target.value })} />
      </label>
      {field.type !== "checkbox" ? (
        <label>Placeholder text
          <input maxLength={200} value={field.placeholder} disabled={disabled} onChange={(event) => onChange({ placeholder: event.target.value })} />
        </label>
      ) : null}
      {field.type === "select" ? (
        <label>Options <span>One option per line</span>
          <textarea
            rows={7}
            disabled={disabled}
            value={field.options.join("\n")}
            onChange={(event) => onChange({ options: event.target.value.split("\n") })}
          />
        </label>
      ) : null}
      <label className="checkbox-setting">
        <input type="checkbox" checked={field.required} disabled={disabled} onChange={(event) => onChange({ required: event.target.checked })} />
        Required field
      </label>
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  const label = <span>{field.label}{field.required ? <strong aria-label="required"> *</strong> : null}</span>;
  if (field.type === "checkbox") {
    return <label className="preview-checkbox"><input type="checkbox" required={field.required} />{label}</label>;
  }
  if (field.type === "textarea") {
    return <label>{label}<textarea rows={4} placeholder={field.placeholder} required={field.required} /></label>;
  }
  if (field.type === "select") {
    return <label>{label}<select required={field.required}><option value="">Select an option</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select></label>;
  }
  return <label>{label}<input type={field.type} placeholder={field.placeholder} required={field.required} /></label>;
}
