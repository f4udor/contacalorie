"use client";

import { useState } from "react";
import type { DataStore, UserSettings } from "@/data";
import { settingsToForm, validateSettingsFields } from "../lib/settings-form";
import { PillButton } from "./ui/ui";
import type { SettingsFieldKey, SettingsFormErrors, SettingsFormValues } from "../lib/settings-form";

/** Stato e salvataggio dei campi di una pagina di Impostazioni: ogni pagina controlla e salva solo i suoi campi. */
export function useFieldsForm(store: DataStore, settings: UserSettings, keys: readonly SettingsFieldKey[], onChanged: () => void) {
  const [values, setValues] = useState<SettingsFormValues>(() => settingsToForm(settings));
  const [errors, setErrors] = useState<SettingsFormErrors>({});
  const [status, setStatus] = useState<{ kind: "ok" | "errore"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: SettingsFieldKey) => (v: string) => {
    setValues((x) => ({ ...x, [key]: v }));
    setStatus(null);
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const r = validateSettingsFields(values, keys);
    if (!r.ok) {
      setErrors(r.errors);
      setStatus({ kind: "errore", text: "Controlla i campi in rosso: non è stato salvato nulla." });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await store.saveSettings(r.patch);
      onChanged();
      setStatus({ kind: "ok", text: "Salvato." });
    } catch {
      setStatus({ kind: "errore", text: "Non salvato: riprova tra poco." });
    } finally {
      setSaving(false);
    }
  };

  return { values, set, errors, status, saving, save };
}

/** Il blocco in fondo a una pagina con campi: messaggio e tasto pieno «Salva». */
export function SaveBar({ status, saving }: { status: { kind: "ok" | "errore"; text: string } | null; saving: boolean }) {
  return (
    <div className="flex flex-col gap-3 pb-2">
      {status && (
        <p role="status" className={`px-4 text-[14px] font-semibold ${status.kind === "ok" ? "text-in-obiettivo" : "text-fuori"}`}>
          {status.text}
        </p>
      )}
      <PillButton filled type="submit" disabled={saving}>
        Salva
      </PillButton>
    </div>
  );
}
