"use client";

import { useState } from "react";
import { bikeToForm, validateBikeForm, validateWeight } from "../lib/activity-form";
import type { BikeFormErrors, BikeFormValues, ParsedBike } from "../lib/activity-form";
import { formatNumber } from "../lib/format";
import type { ActivityRecord } from "@/data";
import { TextField } from "./field";

const primary = "min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50";

/** Modulo "Bici a mano": la parte inserita a mano, che si somma ai km di Salute. Km e kcal: almeno uno. */
export function BikeForm({ existing, kcalPerKm, onSubmit, onDelete }: { existing: ActivityRecord | null; kcalPerKm: number; onSubmit: (bike: ParsedBike) => Promise<void> | void; onDelete?: () => Promise<void> | void }) {
  const [values, setValues] = useState<BikeFormValues>(() => bikeToForm(existing));
  const [errors, setErrors] = useState<BikeFormErrors>({});
  const [saving, setSaving] = useState(false);
  const set = (key: keyof BikeFormValues) => (v: string) => setValues((x) => ({ ...x, [key]: v }));

  const guarded = async (fn: () => Promise<void> | void) => {
    setSaving(true);
    try {
      await fn();
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e il modulo resta com'è, per riprovare.
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateBikeForm(values);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors({});
    await guarded(() => onSubmit(r.bike));
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField id="bike-km" label="Km in bici" value={values.km} onChange={set("km")} error={errors.km} hint="Si sommano ai km arrivati da Salute." />
      <TextField
        id="bike-kcal"
        label="Kcal (facoltative)"
        value={values.kcal}
        onChange={set("kcal")}
        error={errors.kcal}
        inputMode="numeric"
        hint={`Se le lasci vuote si calcolano dai km (${formatNumber(kcalPerKm)} kcal per km).`}
      />
      <button type="submit" disabled={saving} className={primary}>
        Salva bici
      </button>
      {onDelete && (
        <button type="button" disabled={saving} onClick={() => void guarded(onDelete)} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-bad disabled:opacity-50">
          Elimina la bici a mano
        </button>
      )}
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
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e il modulo resta com'è, per riprovare.
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
