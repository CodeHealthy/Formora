import { useEffect, useState } from "react";

import {
  useFormAccessQuery,
  useUpdateFormAccessMutation,
} from "../../../entities/form/model/form-queries";
import type { FormAccessMode } from "../../../shared/api/contracts";

export function FormAccessSettings({ formId, archived }: { formId: string; archived: boolean }) {
  const settings = useFormAccessQuery(formId);
  const update = useUpdateFormAccessMutation(formId);
  const [accessMode, setAccessMode] = useState<FormAccessMode>("LINK");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (settings.data !== undefined) {
      setAccessMode(settings.data.data.accessSettings.accessMode);
    }
  }, [settings.data]);

  const handleSave = async (): Promise<void> => {
    try {
      if (accessMode === "PASSWORD") {
        await update.mutateAsync({ accessMode, password });
      } else {
        await update.mutateAsync({ accessMode, password: null });
      }
      setPassword("");
    } catch {
      return;
    }
  };

  if (settings.isPending) return <p>Loading access settings...</p>;
  if (settings.isError) return <div className="form-alert">Unable to load access settings.</div>;

  const passwordConfigured = settings.data.data.accessSettings.passwordConfigured;

  return (
    <div className="access-settings-form">
      <fieldset disabled={archived || update.isPending}>
        <legend>Who can open and submit this form?</legend>
        <label className={accessMode === "LINK" ? "selected" : ""}>
          <input
            type="radio"
            name="accessMode"
            value="LINK"
            checked={accessMode === "LINK"}
            onChange={() => setAccessMode("LINK")}
          />
          <span><strong>Anyone with the link</strong><small>No password is required.</small></span>
        </label>
        <label className={accessMode === "PASSWORD" ? "selected" : ""}>
          <input
            type="radio"
            name="accessMode"
            value="PASSWORD"
            checked={accessMode === "PASSWORD"}
            onChange={() => setAccessMode("PASSWORD")}
          />
          <span><strong>Anyone with the link and password</strong><small>Guests must enter your password.</small></span>
        </label>
      </fieldset>

      {accessMode === "PASSWORD" ? (
        <label className="access-password">
          Form password
          <input
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            disabled={archived || update.isPending}
            placeholder={passwordConfigured ? "Enter a new password to replace the current one" : "At least 8 characters"}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      ) : null}

      <button
        className="primary-button"
        type="button"
        disabled={archived || update.isPending || (accessMode === "PASSWORD" && password.length < 8)}
        onClick={() => void handleSave()}
      >
        {update.isPending ? "Saving..." : "Save access settings"}
      </button>
      {update.isSuccess ? <p className="success-message">Access settings saved.</p> : null}
      {update.isError ? <div className="form-alert">Unable to save access settings.</div> : null}
    </div>
  );
}
