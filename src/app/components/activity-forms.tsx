"use client";

import { useState } from "react";
import { activityToForm, validateActivityForm, validateWeight } from "../lib/activity-form";
import type { ActivityFormErrors, ActivityFormValues, ParsedActivity } from "../lib/activity-form";
import { formatNumber } from "../lib/format";
import type { ActivityRecord } from "@/data";
import { TextField } from "./field";

const primary = "min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50";

/** Modulo "Attività a mano": passi, km in bici e kcal della bici (facoltative). */
export function ActivityForm({ existing, kcalPerKm, onSubmit }: { existing: ActivityRecord | null; kcalPerKm: number; onSubmit: (a: ParsedActivity) => Promise<void> | void }) {
  const [values, setValues] = useState<ActivityFormValues>(() => activityToForm(existing));
  const [errors, setErrors] = useState<ActivityFormErrors>({});
  const [saving, setSaving] = useState(false);
  const set = (key: keyof ActivityFormValues) => (v: string) => setValues((x) => ({ ...x, [key]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateActivityForm(values);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(r.activity);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField id="act-steps" label="Passi" value={values.steps} onChange={set("steps")} error={errors.steps} inputMode="numeric" />
      <TextField id="act-km" label="Km in bici" value={values.km} onChange={set("km")} error={errors.km} />
      <TextField
        id="act-kcal"
        label="Kcal bici (facoltative)"
        value={values.kcal}
        onChange={set("kcal")}
        error={errors.kcal}
        inputMode="numeric"
        hint={`Se le lasci vuote si calcolano dai km (${formatNumber(kcalPerKm)} kcal per km).`}
      />
      <button type="submit" disabled={saving} className={primary}>
        Salva attività
      </button>
    </form>
  );
}

/** Modulo "Pesata": un peso in kg per giorno; una seconda pesata nello stesso giorno sostituisce la prima. */
export function WeightForm({ existingKg, onSubmit }: { existingKg: number | null; onSubmit: (kg: number) => Promise<void> | void }) {
  const [value, setValue] = useState(existingKg === null ? "" : String(existingKg).replace(".", ","));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateWeight(value);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await onSubmit(r.weightKg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField
        id="weight-kg"
        label="Peso (kg)"
        value={value}
        onChange={setValue}
        error={error}
        hint={existingKg === null ? "Una pesata per giorno." : "Hai già una pesata per questo giorno: salvando la sostituisci."}
      />
      <button type="submit" disabled={saving} className={primary}>
        Salva pesata
      </button>
    </form>
  );
}
