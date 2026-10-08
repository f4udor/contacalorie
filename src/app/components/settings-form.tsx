"use client";

import { useState } from "react";
import { DEFAULT_SETTINGS, mergeSettings, nutrientTargets } from "@/engine";
import type { DateKey } from "@/engine";
import type { DataStore, UserSettings, WeighIn } from "@/data";
import { formatNumber } from "../lib/format";
import { defaultsPatch, settingsToForm, validateSettingsForm } from "../lib/settings-form";
import type { SettingsFieldKey, SettingsFormErrors, SettingsFormValues } from "../lib/settings-form";
import { currentWeight } from "../lib/today-view";
import { TextField } from "./field";
import { Sheet } from "./sheet";

interface Props {
  store: DataStore;
  settings: UserSettings;
  weighIns: WeighIn[];
  today: DateKey;
  /** Rilegge le impostazioni dopo un salvataggio; `reset` è vero dopo il ripristino, quando il modulo va riempito di nuovo. */
  onChanged: (reset: boolean) => void;
}

const D = DEFAULT_SETTINGS;
const pct = (fraction: number) => formatNumber(fraction * 100, 1);

function Section({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4">
      <h2 className="text-[22px] font-bold leading-tight">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-muted">{intro}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** Modulo delle impostazioni. Un campo vuoto usa il valore predefinito (mostrato come suggerimento). */
export function SettingsForm({ store, settings, weighIns, today, onChanged }: Props) {
  const [values, setValues] = useState<SettingsFormValues>(() => settingsToForm(settings));
  const [errors, setErrors] = useState<SettingsFormErrors>({});
  const [status, setStatus] = useState<{ kind: "ok" | "errore"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const set = (key: SettingsFieldKey) => (v: string) => {
    setValues((x) => ({ ...x, [key]: v }));
    setStatus(null);
  };
  const field = (key: SettingsFieldKey, label: string, opts: { placeholder?: string; hint?: string; inputMode?: "decimal" | "numeric" } = {}) => (
    <TextField key={key} id={`set-${key}`} label={label} value={values[key]} onChange={set(key)} error={errors[key]} inputMode={opts.inputMode ?? "decimal"} placeholder={opts.placeholder} hint={opts.hint} />
  );

  // Valori proposti dalla formula, con le impostazioni salvate (non quelle in corso di modifica).
  const merged = mergeSettings(settings as Record<string, unknown>);
  const weight = currentWeight(weighIns, today, settings.weightKg);
  const targetWeight = settings.targetWeightKg ?? null;
  const proposed = nutrientTargets(merged.baseKcal, weight ?? 0, { ...merged, proteinGramsManual: null, fatGramsManual: null }, targetWeight);
  // I grassi non dipendono dal peso; le proteine sì.
  const proteinProposed = weight === null && targetWeight === null ? null : proposed.protein;
  const proteinBasis =
    targetWeight !== null
      ? `${formatNumber(merged.proteinPerKgTarget, 1)} g per kg del peso obiettivo (${formatNumber(targetWeight, 1)} kg)`
      : weight !== null
        ? `${formatNumber(merged.proteinPerKg, 1)} g per kg del peso (${formatNumber(weight, 1)} kg)`
        : "serve il peso o il peso obiettivo";
  const formulaRow = (key: "proteinGramsManual" | "fatGramsManual", label: string, proposedValue: number | null) => (
    <div key={key} className="flex flex-col gap-1">
      {field(key, label, {
        placeholder: "Formula",
        hint:
          proposedValue === null
            ? key === "proteinGramsManual"
              ? "Proposto dalla formula: serve il peso o il peso obiettivo."
              : "Proposto dalla formula: serve il peso."
            : `Proposto dalla formula: ${formatNumber(proposedValue)} g` + (key === "proteinGramsManual" ? `. Calcolato su ${proteinBasis}.` : ""),
      })}
      {values[key] !== "" && (
        <button type="button" onClick={() => set(key)("")} className="-ml-2 min-h-11 w-fit px-2 text-[15px] font-semibold text-accent">
          Torna alla formula
        </button>
      )}
    </div>
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateSettingsForm(values);
    if (!r.ok) {
      setErrors(r.errors);
      setStatus({ kind: "errore", text: "Controlla i campi in rosso: non è stato salvato nulla." });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await store.saveSettings(r.patch);
      onChanged(false);
      setStatus({ kind: "ok", text: "Salvato." });
    } catch {
      setStatus({ kind: "errore", text: "Non salvato: riprova tra poco." });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    try {
      await store.saveSettings(defaultsPatch());
    } catch {
      return; // l'avviso in cima lo spiega; il pannello resta aperto per riprovare
    }
    setConfirmReset(false);
    onChanged(true);
  };

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-3">
      <Section title="Profilo" intro="Dati su di te. Il peso serve a calcolare i grammi di proteine.">
        {field("weightKg", "Peso (kg)")}
        {field("heightCm", "Altezza (cm)")}
        {field("ageYears", "Età (anni)", { inputMode: "numeric" })}
        {field("targetWeightKg", "Peso obiettivo (kg)")}
      </Section>

      <Section title="Obiettivi" intro="Da quante kcal parte ogni giorno e quanti grammi di nutrienti puntare. Lasciando un campo vuoto vale il valore suggerito.">
        {field("baseKcal", "Kcal base", { placeholder: formatNumber(D.baseKcal), hint: "Le kcal di un giorno senza bonus né recupero." })}
        {field("floorKcal", "Soglia minima (kcal)", { placeholder: formatNumber(D.floorKcal), hint: "La base non scende mai sotto questo valore. Il bonus si somma sopra." })}
        {formulaRow("proteinGramsManual", "Proteine (g)", proteinProposed)}
        {formulaRow("fatGramsManual", "Grassi (g)", proposed.fat)}
        {field("fiberMin", "Fibre (g, minimo)", { placeholder: formatNumber(D.fiberMin) })}
        {field("saltMax", "Sale (g, massimo)", { placeholder: formatNumber(D.saltMax, 1) })}
        {field("margin", "Margine dei semafori (%)", { placeholder: pct(D.margin), hint: "Quanto ci si può allontanare dall'obiettivo restando in verde." })}
      </Section>

      <Section title="Attività" intro="Quante kcal in più contano bici e passi sull'obiettivo del giorno.">
        {field("kcalPerKm", "Kcal per km in bici", { placeholder: formatNumber(D.kcalPerKm) })}
        {field("kcalPerStep", "Kcal per passo", { placeholder: formatNumber(D.kcalPerStep, 2) })}
        {field("stepThreshold", "Soglia passi", { placeholder: formatNumber(D.stepThreshold), inputMode: "numeric", hint: "Contano solo i passi oltre questa soglia." })}
        {field("bonusShare", "Quota di bonus (%)", { placeholder: pct(D.bonusShare), hint: "Quanta parte delle kcal bruciate si aggiunge all'obiettivo." })}
      </Section>

      <Section title="Pasto libero" intro="Un pasto a settimana che nel budget del giorno conta al massimo questo numero di kcal.">
        {field("freeMealCap", "Tetto di kcal", { placeholder: formatNumber(D.freeMealCap) })}
      </Section>

      <div className="flex flex-col gap-3 pb-2">
        {status && (
          <p role="status" className={`text-center text-[15px] font-semibold ${status.kind === "ok" ? "text-ok" : "text-bad"}`}>
            {status.text}
          </p>
        )}
        <button type="submit" disabled={saving} className="min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50">
          Salva
        </button>
        <button type="button" onClick={() => setConfirmReset(true)} className="min-h-12 rounded-xl bg-card px-4 text-[17px] font-semibold text-bad">
          Ripristina valori predefiniti
        </button>
      </div>

      {confirmReset && (
        <Sheet open onClose={() => setConfirmReset(false)} title="Ripristinare?">
          <div className="flex flex-col gap-4">
            <p className="text-[17px]">Obiettivi, regole di calcolo, attività e pasto libero tornano ai valori predefiniti. Il profilo resta com&apos;è.</p>
            <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-bad-fill px-4 text-[17px] font-semibold text-white">
              Ripristina
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
              Annulla
            </button>
          </div>
        </Sheet>
      )}
    </form>
  );
}
