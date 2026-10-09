"use client";

import { useCallback, useState } from "react";
import type { MealSlot } from "@/engine";
import { useAuth } from "../auth-provider";
import { estimateDish, requestEstimate } from "./ai-client";
import { applyCorrection, applyNumbers, estimateSourceText, valuesToProposal } from "./dish-sheet";
import { validateMealForm } from "./meal-form";
import type { MealFormErrors, MealFormValues, ParsedMeal } from "./meal-form";
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

  const patch = useCallback((p: Partial<MealFormValues>) => {
    setValues((v) => ({ ...v, ...p }));
  }, []);

  /** "Stima con l'AI": nome e quantità → numeri nuovi, che sostituiscono quelli già scritti (restano modificabili). */
  const estimate = async () => {
    if (values.name.trim() === "") {
      setAiError("Scrivi il nome del piatto, poi tocca «Stima con l'AI».");
      return;
    }
    setBusy(true);
    setAiError(null);
    const r = await estimateDish(values.name, values.quantity, getAccessToken);
    setBusy(false);
    if (!r.ok) {
      setAiError(r.message);
      return;
    }
    setValues((v) => applyNumbers(v, r.numbers));
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

  return { values, patch, errors, busy, aiAvailable, aiError, aiNote, estimate, correct, validate };
}
