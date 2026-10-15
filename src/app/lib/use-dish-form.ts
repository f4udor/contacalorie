"use client";

import { useState } from "react";
import type { MealSlot } from "@/engine";
import { useAuth } from "../auth-provider";
import { estimateDish, requestEstimate } from "./ai-client";
import { applyCorrection, applyNumbers, estimateSourceText, valuesToProposal } from "./dish-sheet";
import { validateMealForm } from "./meal-form";
import type { MealFormErrors, MealFormValues, ParsedMeal } from "./meal-form";
import { NO_SCALE, markManual, parseWeightG, rescaleByWeight } from "./portion-scale";
import type { ScaleState } from "./portion-scale";
import { DISH_NUMBER_KEYS } from "./proposal-form";
import type { DishNumberKey } from "./proposal-form";
import { useAiAvailable } from "./use-ai";

/**
 * Stato della scheda del piatto, uno solo per i due modi (AI e Manuale): passando dall'uno all'altro non si perde nulla.
 * Comprende la stima con l'AI del piatto a mano e la correzione a parole del piatto aperto.
 */
export function useDishForm(initial: MealFormValues, freeAllowedFor: (slot: MealSlot) => boolean, originalText: string | null = null) {
  const { getAccessToken } = useAuth();
  const aiAvailable = useAiAvailable() === true;
  const [values, setValues] = useState<MealFormValues>(initial);
  const [errors, setErrors] = useState<MealFormErrors>({});
  const [busy, setBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Quantità senza AI (BRIEF §4.1): se il piatto ha un peso all'apertura, cambiare il peso ricalcola kcal e nutrienti dai valori di partenza;
  // su un piatto senza peso, scrivere il peso lo registra e basta.
  const [rescalesOnWeight, setRescalesOnWeight] = useState(parseWeightG(initial.weightG) !== null);
  const [scale, setScale] = useState<ScaleState>(NO_SCALE);
  // Il peso per cui è stata fatta l'ultima stima con l'AI (null: stima senza peso).
  const [aiForWeightG, setAiForWeightG] = useState<number | null>(null);

  const patch = (p: Partial<MealFormValues>) => {
    const { weightG, ...rest } = p;
    let next: MealFormValues = { ...values, ...rest };
    let state = scale;
    if (weightG !== undefined) {
      if (rescalesOnWeight) {
        const r = rescaleByWeight(next, state, weightG);
        // Con il ricalcolo i numeri non vengono dal modello: la nota e il controllo di coerenza non valgono più.
        if (DISH_NUMBER_KEYS.some((k) => r.values[k] !== next[k])) setAiNote(null);
        next = r.values;
        state = r.state;
      } else {
        next = { ...next, weightG };
      }
    }
    const typed = (Object.keys(rest) as (keyof MealFormValues)[]).filter((k): k is DishNumberKey => (DISH_NUMBER_KEYS as readonly string[]).includes(k));
    setScale(markManual(state, typed));
    setValues(next);
  };

  /** "Stima con l'AI": nome, peso e ingredienti → numeri nuovi, che sostituiscono quelli già scritti (restano modificabili). */
  const estimate = async () => {
    if (values.name.trim() === "") {
      setAiError("Scrivi il nome del piatto, poi tocca «Stima con l'AI».");
      return;
    }
    setBusy(true);
    setAiError(null);
    const written = parseWeightG(values.weightG);
    const r = await estimateDish({ name: values.name, weightG: written, ingredients: values.quantity }, getAccessToken);
    setBusy(false);
    if (!r.ok) {
      setAiError(r.message);
      return;
    }
    setValues((v) => ({ ...applyNumbers(v, r.numbers), weightG: r.weightG ? String(r.weightG) : v.weightG }));
    setScale(NO_SCALE);
    if (r.weightG) setRescalesOnWeight(true);
    setAiForWeightG(written);
    setErrors({});
    setAiNote(r.note);
  };

  /** In modifica, modo AI: corregge a parole il piatto aperto; la stima aggiornata finisce negli stessi campi. Restituisce se è riuscita. */
  const correct = async (correction: string): Promise<boolean> => {
    const c = correction.trim();
    if (c === "") return false;
    setBusy(true);
    setAiError(null);
    const r = await requestEstimate({ text: estimateSourceText(values, originalText), previous: valuesToProposal(values), correction: c }, getAccessToken);
    setBusy(false);
    if (!r.ok) {
      setAiError(r.message);
      return false;
    }
    const applied = applyCorrection(values, r.proposal);
    setValues(applied.values);
    setScale(NO_SCALE);
    if (parseWeightG(applied.values.weightG) !== null) setRescalesOnWeight(true);
    setAiForWeightG(null);
    setErrors({});
    setAiNote(applied.note);
    return true;
  };

  /** Controlla i campi: se sono validi restituisce il piatto da salvare, altrimenti mostra gli errori accanto ai campi. */
  const validate = (): ParsedMeal | null => {
    const r = validateMealForm(values, freeAllowedFor(values.slot), aiAvailable);
    if (!r.ok) {
      setErrors(r.errors);
      return null;
    }
    setErrors({});
    return r.meal;
  };

  return { values, patch, errors, busy, aiAvailable, aiError, aiNote, aiForWeightG, estimate, correct, validate };
}
