"use client";

import { useEffect, useState } from "react";
import { useDataProblem, useDataStore } from "../data-provider";
import { checkOnboardingStep, initialOnboardingValues, needsOnboarding, onboardingPatch, onboardingSummary, ONBOARDING_STEPS, SKIP_PATCH } from "../lib/onboarding";
import type { OnboardingKey, OnboardingValues } from "../lib/onboarding";
import { formatDateFull, formatNumber } from "../lib/format";
import type { SettingsFormErrors } from "../lib/settings-form";
import { todayKey } from "../lib/today";
import { Caption, DateInput, FieldRow, GroupedList, PillButton, RowInput, SelectInput } from "./ui/ui";

const TITLES = ["Su di te", "Il tuo obiettivo", "Le tue calorie"] as const;

const SEX_OPTIONS = [
  { value: "", label: "Da scegliere" },
  { value: "uomo", label: "Uomo" },
  { value: "donna", label: "Donna" },
] as const;

const LABELS: Record<Exclude<OnboardingKey, "sex" | "targetDate" | "baseKcal">, { label: string; unit: string }> = {
  ageYears: { label: "Età", unit: "anni" },
  heightCm: { label: "Altezza", unit: "cm" },
  weightKg: { label: "Peso", unit: "kg" },
  targetWeightKg: { label: "Peso obiettivo", unit: "kg" },
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
    <FieldRow key={key} label={LABELS[key].label} htmlFor={`onb-${key}`} unit={LABELS[key].unit} error={errors[key]}>
      <RowInput id={`onb-${key}`} value={values[key]} onChange={set(key)} inputMode={key === "ageYears" ? "numeric" : "decimal"} invalid={Boolean(errors[key])} />
    </FieldRow>
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="onb-title" className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-sfondo pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex min-h-14 items-center justify-between">
          <p className="text-[15px] font-semibold text-testo-secondario" aria-live="polite">
            {step + 1} di {ONBOARDING_STEPS.length}
          </p>
          <button type="button" disabled={busy} onClick={() => void finish(SKIP_PATCH)} className="min-h-11 px-2 text-[17px] font-medium text-comando disabled:opacity-50">
            Salta
          </button>
        </div>
        <p className="mt-2 text-[13px] font-medium uppercase tracking-wide text-testo-secondario">Benvenuto</p>
        <h1 id="onb-title" className="mb-6 mt-1 text-[34px] font-bold leading-tight tracking-tight">
          {TITLES[step]}
        </h1>
        <div className="flex flex-col gap-1.5">
          {step === 0 && (
            <GroupedList>
              <FieldRow label="Sesso" htmlFor="onb-sex" error={errors.sex}>
                <SelectInput id="onb-sex" value={values.sex as "" | "uomo" | "donna"} options={SEX_OPTIONS} onChange={set("sex")} />
              </FieldRow>
              {field("ageYears")}
              {field("heightCm")}
            </GroupedList>
          )}
          {step === 1 && (
            <GroupedList>
              {field("weightKg")}
              {field("targetWeightKg")}
              <FieldRow label="Data obiettivo" htmlFor="onb-targetDate" error={errors.targetDate}>
                <DateInput id="onb-targetDate" value={values.targetDate} onChange={set("targetDate")} />
              </FieldRow>
            </GroupedList>
          )}
          {last && (
            <>
              <GroupedList>
                <li className="flex min-h-12 items-baseline justify-between gap-3 px-4 py-2.5">
                  <span className="text-[17px]">Calorie di base {values.baseKcal.trim() !== "" ? "personalizzate" : summary?.calculated ? "calcolate" : "predefinite"}</span>
                  <span data-onb-base className="text-[22px] font-bold tabular-nums">
                    {summary ? formatNumber(summary.baseKcal) : "–"} kcal
                  </span>
                </li>
                {summary?.minimum != null && (
                  <li className="flex min-h-12 items-baseline justify-between gap-3 px-4 py-2.5">
                    <span className="text-[17px]">Metabolismo basale stimato</span>
                    <span className="text-[17px] tabular-nums text-testo-secondario">{formatNumber(summary.minimum)} kcal</span>
                  </li>
                )}
                <FieldRow label="Calorie di base scelte da te" htmlFor="onb-baseKcal" error={errors.baseKcal}>
                  <RowInput id="onb-baseKcal" value={values.baseKcal} onChange={set("baseKcal")} inputMode="decimal" placeholder="facoltative" invalid={Boolean(errors.baseKcal)} />
                </FieldRow>
              </GroupedList>
              {summary?.minimum != null && <Caption>È una stima dal profilo, non una misura precisa. Le calorie di base non scendono sotto questo valore.</Caption>}
              {summary && !summary.calculated && <Caption>Completa il profilo in Impostazioni per calcolarle.</Caption>}
              {summary?.earliestDate && (
                <p className="px-4 text-[15px] font-medium text-attenzione" data-unreachable>
                  Data troppo vicina. Prima data possibile: <strong>{formatDateFull(summary.earliestDate)}</strong>
                </p>
              )}
            </>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <PillButton filled disabled={busy} onClick={next}>
            {last ? "Inizia" : "Avanti"}
          </PillButton>
          {step > 0 && (
            <PillButton disabled={busy} onClick={() => setStep(step - 1)}>
              Indietro
            </PillButton>
          )}
        </div>
      </div>
    </div>
  );
}
