"use client";

import { useEffect, useState } from "react";
import { useDataProblem, useDataStore } from "../data-provider";
import { checkOnboardingStep, initialOnboardingValues, needsOnboarding, onboardingPatch, onboardingSummary, ONBOARDING_STEPS, SKIP_PATCH } from "../lib/onboarding";
import type { OnboardingKey, OnboardingValues } from "../lib/onboarding";
import { formatDateFull, formatNumber } from "../lib/format";
import type { SettingsFormErrors } from "../lib/settings-form";
import { todayKey } from "../lib/today";
import { TextField } from "./field";
import { ChoiceField, DateField } from "./settings-fields";

const TITLES = ["Su di te", "Il tuo obiettivo", "Le tue kcal"] as const;

const LABELS: Record<Exclude<OnboardingKey, "sex" | "targetDate" | "baseKcal">, string> = {
  ageYears: "Età (anni)",
  heightCm: "Altezza (cm)",
  weightKg: "Peso (kg)",
  targetWeightKg: "Peso obiettivo (kg)",
};

/** Primo avvio guidato: tre schermate brevi per chi non ha ancora nessuna impostazione. Compare sopra l'app e si può saltare. */
export function Onboarding() {
  const store = useDataStore();
  const { problem } = useDataProblem();
  // undefined = non ancora letto, true = da mostrare, false = non serve
  const [show, setShow] = useState<boolean | undefined>(undefined);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<OnboardingValues>(initialOnboardingValues);
  const [errors, setErrors] = useState<SettingsFormErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!store) return;
    let alive = true;
    store
      .getSettings()
      .then((s) => alive && setShow(needsOnboarding(s)))
      .catch(() => alive && setShow(false)); // lettura non riuscita: l'avviso in cima lo spiega, l'app si apre comunque
    return () => {
      alive = false;
    };
  }, [store]);

  // Con l'avviso "dati illeggibili" in cima si aspetta che venga chiuso: il banner coprirebbe l'intestazione del primo avvio.
  if (!store || !show || problem?.kind === "avviso") return null;

  const finish = async (patch: Parameters<typeof store.saveSettings>[0]) => {
    setBusy(true);
    try {
      await store.saveSettings(patch);
      // Si riparte da Oggi con una pagina nuova: così tutte le schermate leggono le impostazioni appena salvate.
      window.location.href = new URL("/", window.location.origin).href;
    } catch {
      setBusy(false); // salvataggio non riuscito: l'avviso in cima lo spiega e si può riprovare
    }
  };

  const keys = ONBOARDING_STEPS[step];
  const last = step === ONBOARDING_STEPS.length - 1;
  const set = (key: OnboardingKey) => (v: string) => setValues((o) => ({ ...o, [key]: v }));
  const today = todayKey();
  const summary = last ? onboardingSummary(values, today) : null;

  const next = () => {
    const found = checkOnboardingStep(values, keys);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    if (!last) {
      setStep(step + 1);
      return;
    }
    const r = onboardingPatch(values);
    if (!r.ok) {
      // Un campo di una schermata precedente non è valido: si torna a quella.
      const bad = ONBOARDING_STEPS.findIndex((ks) => ks.some((k) => r.errors[k]));
      setErrors(r.errors);
      setStep(Math.max(bad, 0));
      return;
    }
    void finish(r.patch);
  };

  const field = (key: Exclude<OnboardingKey, "sex" | "targetDate" | "baseKcal">) => (
    <TextField key={key} id={`onb-${key}`} label={LABELS[key]} value={values[key]} onChange={set(key)} error={errors[key]} inputMode={key === "ageYears" ? "numeric" : "decimal"} />
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="onb-title" className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-bg pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex min-h-14 items-center justify-between">
          <p className="text-[15px] font-semibold text-muted" aria-live="polite">
            {step + 1} di {ONBOARDING_STEPS.length}
          </p>
          <button type="button" disabled={busy} onClick={() => void finish(SKIP_PATCH)} className="min-h-11 px-2 text-[17px] font-semibold text-accent disabled:opacity-50">
            Salta
          </button>
        </div>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">Benvenuto</p>
        <h1 id="onb-title" className="mb-6 mt-1 text-[34px] font-bold leading-tight tracking-tight">
          {TITLES[step]}
        </h1>
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-4">
          {step === 0 && (
            <>
              <ChoiceField
                id="onb-sex"
                label="Sesso"
                value={values.sex}
                onChange={set("sex")}
                error={errors.sex}
                options={[
                  { value: "uomo", label: "Uomo" },
                  { value: "donna", label: "Donna" },
                ]}
              />
              {field("ageYears")}
              {field("heightCm")}
            </>
          )}
          {step === 1 && (
            <>
              {field("weightKg")}
              {field("targetWeightKg")}
              <DateField id="onb-targetDate" label="Data obiettivo" value={values.targetDate} onChange={set("targetDate")} error={errors.targetDate} />
            </>
          )}
          {last && (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-muted">Kcal base {values.baseKcal.trim() !== "" ? "personalizzate" : summary?.calculated ? "calcolate" : "predefinite"}</span>
                <span data-onb-base className="text-[22px] font-bold tabular-nums">
                  {summary ? formatNumber(summary.baseKcal) : "–"} kcal
                </span>
              </div>
              {summary?.minimum != null && (
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-muted">Metabolismo basale</span>
                    <span className="text-[17px] font-semibold tabular-nums">{formatNumber(summary.minimum)} kcal</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">La base del giorno non scende sotto questo valore</p>
                </div>
              )}
              {summary && !summary.calculated && <p className="text-sm text-muted">Con sesso, età, altezza e peso le kcal si calcolano da sole: puoi completarli in Impostazioni.</p>}
              {summary?.earliestDate && (
                <p className="text-[15px] font-medium" data-unreachable>
                  Con la data scelta la base resta al minimo. Prima data possibile: <strong>{formatDateFull(summary.earliestDate)}</strong>
                </p>
              )}
              <TextField id="onb-baseKcal" label="Cambia la base a mano (kcal)" value={values.baseKcal} onChange={set("baseKcal")} error={errors.baseKcal} placeholder={summary ? formatNumber(summary.baseKcal) : undefined} />
            </>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <button type="button" disabled={busy} onClick={next} className="min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50">
            {last ? "Fine" : "Avanti"}
          </button>
          {step > 0 && (
            <button type="button" disabled={busy} onClick={() => setStep(step - 1)} className="min-h-12 rounded-xl bg-card px-4 text-[17px] font-semibold text-accent disabled:opacity-50">
              Indietro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
