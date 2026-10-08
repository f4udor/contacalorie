"use client";

import { useEffect, useState } from "react";
import { useDataStore } from "../data-provider";
import { initialOnboardingValues, needsOnboarding, onboardingPatch, SKIP_PATCH } from "../lib/onboarding";
import type { OnboardingValues } from "../lib/onboarding";
import type { SettingsFormErrors } from "../lib/settings-form";
import { TextField } from "./field";

const STEPS = [
  { key: "weightKg", title: "Il tuo peso", text: "Serve per calcolare le proteine. Puoi cambiarlo quando vuoi in Impostazioni.", label: "Peso (kg)", placeholder: "es. 92,5" },
  { key: "targetWeightKg", title: "Il tuo peso obiettivo", text: "Se lo indichi, le proteine si calcolano su questo peso. Puoi lasciarlo vuoto.", label: "Peso obiettivo (kg)", placeholder: "es. 82" },
  { key: "baseKcal", title: "Le kcal di ogni giorno", text: "Le kcal di base della tua giornata. Sono già quelle predefinite: cambiale solo se sai quali ti servono.", label: "Kcal base", placeholder: "" },
] as const;

/** Primo avvio guidato: tre schermate brevi per chi non ha ancora nessuna impostazione. Compare sopra l'app e si può saltare. */
export function Onboarding() {
  const store = useDataStore();
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

  if (!store || !show) return null;

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

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  const next = () => {
    const r = onboardingPatch(values);
    if (!r.ok && r.errors[current.key]) {
      setErrors({ [current.key]: r.errors[current.key] });
      return;
    }
    setErrors({});
    if (!last) {
      setStep(step + 1);
      return;
    }
    if (!r.ok) {
      // Un campo di un passo precedente non è valido: si torna a quello.
      const bad = STEPS.findIndex((s) => r.errors[s.key]);
      setErrors(r.errors);
      setStep(bad);
      return;
    }
    void finish(r.patch);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="onb-title" className="fixed inset-0 z-[55] flex flex-col bg-bg pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex min-h-14 items-center justify-between">
          <p className="text-[15px] font-semibold text-muted" aria-live="polite">
            {step + 1} di {STEPS.length}
          </p>
          <button type="button" disabled={busy} onClick={() => void finish(SKIP_PATCH)} className="min-h-11 px-2 text-[17px] font-semibold text-accent disabled:opacity-50">
            Salta
          </button>
        </div>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">Benvenuto</p>
        <h1 id="onb-title" className="mt-1 text-[34px] font-bold leading-tight tracking-tight">
          {current.title}
        </h1>
        <p className="mb-6 mt-2 text-[17px] text-muted">{current.text}</p>
        <div className="rounded-2xl bg-card p-4">
          <TextField
            id={`onb-${current.key}`}
            label={current.label}
            value={values[current.key]}
            onChange={(v) => setValues((o) => ({ ...o, [current.key]: v }))}
            error={errors[current.key]}
            placeholder={current.placeholder}
          />
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
