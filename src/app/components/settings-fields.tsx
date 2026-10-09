"use client";

import { useState } from "react";
import type { DataStore, UserSettings } from "@/data";
import { settingsToForm, validateSettingsFields } from "../lib/settings-form";
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

/** Il blocco in fondo a una pagina con campi: messaggio e pulsante «Salva». */
export function SaveBar({ status, saving }: { status: { kind: "ok" | "errore"; text: string } | null; saving: boolean }) {
  return (
    <div className="flex flex-col gap-3 pb-2">
      {status && (
        <p role="status" className={`text-center text-[15px] font-semibold ${status.kind === "ok" ? "text-ok" : "text-bad"}`}>
          {status.text}
        </p>
      )}
      <button type="submit" disabled={saving} className="min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50">
        Salva
      </button>
    </div>
  );
}

/** Scelta tra due voci (sesso). Vuoto = non scelto. */
export function ChoiceField({ id, label, value, options, onChange, error }: { id: string; label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-sm font-semibold text-muted">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="grid grid-cols-2 gap-0.5 rounded-xl bg-bg p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(value === o.value ? "" : o.value)}
            className={`min-h-11 rounded-[10px] px-3 text-[15px] font-semibold ${value === o.value ? "bg-accent text-white" : "text-fg"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}

/** Campo data (selettore del telefono); il valore è AAAA-MM-GG, vuoto = nessuna data. */
export function DateField({ id, label, value, onChange, error, min, max }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; min?: string; max?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`min-h-11 w-full min-w-0 appearance-none rounded-xl bg-bg px-3 text-[17px] outline-none focus:ring-2 focus:ring-accent ${error ? "ring-2 ring-bad" : ""}`}
      />
      {error && <p className="text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
