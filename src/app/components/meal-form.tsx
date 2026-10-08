"use client";

import { useState } from "react";
import { useAuth } from "../auth-provider";
import { estimateDish } from "../lib/ai-client";
import { useAiAvailable } from "../lib/use-ai";
import { FreeMealSwitch } from "./free-meal-switch";
import type { MealSlot } from "@/engine";
import { SLOTS, validateMealForm } from "../lib/meal-form";
import type { MealFieldKey, MealFormErrors, MealFormValues, ParsedMeal } from "../lib/meal-form";

interface MealFormProps {
  initial: MealFormValues;
  /** Dice se il pasto di quella fascia può essere libero (false se la settimana ha già un altro pasto libero). */
  freeAllowedFor: (slot: MealSlot) => boolean;
  /** Dice se il pasto di quella fascia è già libero: scegliendo una fascia l'interruttore ne segue lo stato. */
  mealIsFreeFor?: (slot: MealSlot) => boolean;
  /** La fascia è già stabilita (si aggiunge un piatto a un pasto) e non si sceglie. */
  lockedSlot?: boolean;
  /** Tetto di kcal del pasto libero, dalle impostazioni. */
  freeMealCap: number;
  submitLabel: string;
  onSubmit: (meal: ParsedMeal) => Promise<void> | void;
  /** Se presente compare "Elimina", con conferma. */
  onDelete?: () => Promise<void> | void;
  deleteName?: string;
  /** Contenuto in più sotto i pulsanti (es. "Salva nei preferiti"). */
  extra?: React.ReactNode;
}

const NUMERIC: { key: Exclude<MealFieldKey, "isFree">; label: string; required?: boolean }[] = [
  { key: "kcal", label: "Kcal", required: true },
  { key: "protein", label: "Proteine (g)" },
  { key: "carbs", label: "Carboidrati (g)" },
  { key: "fat", label: "Grassi (g)" },
  { key: "fiber", label: "Fibre (g)" },
  { key: "salt", label: "Sale (g)" },
];

const input = "min-h-11 w-full rounded-xl bg-bg px-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent";

/** Modulo per aggiungere o modificare un pasto a mano. */
export function MealForm({ initial, freeAllowedFor, mealIsFreeFor, lockedSlot = false, freeMealCap, submitLabel, onSubmit, onDelete, deleteName, extra }: MealFormProps) {
  const [values, setValues] = useState<MealFormValues>(initial);
  const [errors, setErrors] = useState<MealFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const aiAvailable = useAiAvailable() === true;
  const { getAccessToken } = useAuth();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const set = <K extends keyof MealFormValues>(key: K, value: MealFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  // Se il pasto è già libero resta modificabile anche quando la settimana "ne ha" uno: è proprio quello.
  const freeAllowed = freeAllowedFor(values.slot);
  const switchDisabled = !freeAllowed && !values.isFree;
  const slotName = (SLOTS.find((x) => x.value === values.slot)?.label ?? "").toLowerCase();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateMealForm(values, freeAllowed, aiAvailable);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(r.meal);
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e il modulo resta com'è, per riprovare.
    } finally {
      setSaving(false);
    }
  };

  const estimate = async () => {
    if (values.name.trim() === "") {
      setAiError("Scrivi il nome del piatto, poi tocca «Stima con AI».");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    const r = await estimateDish(values.name, values.quantity, getAccessToken);
    setAiBusy(false);
    if (!r.ok) {
      setAiError(r.message);
      return;
    }
    const asText = (n: number) => String(n).replace(".", ",");
    setValues((v) => ({ ...v, kcal: asText(r.numbers.kcal), protein: asText(r.numbers.protein), carbs: asText(r.numbers.carbs), fat: asText(r.numbers.fat), fiber: asText(r.numbers.fiber), salt: asText(r.numbers.salt) }));
    setErrors({});
    setAiNote(r.note);
  };

  if (confirming && onDelete) {
    return (
      <div className="flex flex-col gap-4 py-2" role="alertdialog" aria-label="Conferma eliminazione">
        <p className="text-[17px]">
          Eliminare <strong>{deleteName}</strong>? Non si può annullare.
        </p>
        <button type="button" disabled={saving} onClick={async () => { setSaving(true); try { await onDelete(); } catch { /* l'avviso in cima lo spiega; si può riprovare */ } finally { setSaving(false); } }} className="min-h-12 rounded-xl bg-bad-fill px-4 text-[17px] font-semibold text-white disabled:opacity-50">
          Elimina
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
          Annulla
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="meal-name" className="text-sm font-semibold text-muted">Nome del piatto</label>
        <input id="meal-name" type="text" autoComplete="off" value={values.name} onChange={(e) => set("name", e.target.value)} className={input} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="meal-quantity" className="text-sm font-semibold text-muted">Quantità (facoltativa)</label>
        <textarea id="meal-quantity" autoComplete="off" rows={Math.min(8, Math.max(1, Math.ceil(values.quantity.length / 30)))} value={values.quantity} onChange={(e) => set("quantity", e.target.value.replace(/\n/g, " "))} className={`${input} field-sizing-content resize-none py-2.5`} />
      </div>

      {!lockedSlot && (
      <div className="flex flex-col gap-1.5">
        <span id="slot-label" className="text-sm font-semibold text-muted">Fascia</span>
        <div role="radiogroup" aria-labelledby="slot-label" className="grid grid-cols-4 gap-1 rounded-xl bg-bg p-1">
          {SLOTS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={values.slot === s.value}
              onClick={() => {
                set("slot", s.value);
                if (mealIsFreeFor) set("isFree", mealIsFreeFor(s.value));
              }}
              className={`min-h-11 rounded-lg px-1 text-[15px] font-semibold ${values.slot === s.value ? "bg-accent text-white" : "text-fg"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {aiAvailable && values.kcal.trim() === "" && (
        <div className="flex flex-col gap-2 rounded-xl bg-bg p-3">
          <p className="text-[15px] text-muted">Non conosci i numeri? Scrivi nome e quantità: li stima l&apos;AI e tu li controlli.</p>
          <button type="button" onClick={estimate} disabled={aiBusy} className="min-h-12 rounded-xl bg-card px-4 text-[17px] font-semibold text-accent disabled:opacity-50">
            {aiBusy ? "Sto stimando…" : "Stima con AI"}
          </button>
          {aiError && (
            <p role="alert" className="text-[15px] font-medium text-bad">
              {aiError}
            </p>
          )}
        </div>
      )}
      {aiNote !== null && values.kcal.trim() !== "" && (
        <p role="status" className="rounded-xl bg-bg px-3 py-2.5 text-[15px]">
          <span className="font-semibold">Stimato con l&apos;AI: controlla i numeri.</span> {aiNote}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {NUMERIC.map(({ key, label, required }) => (
          <div key={key} className={`flex flex-col gap-1.5 ${key === "kcal" ? "col-span-2" : ""}`}>
            <label htmlFor={`meal-${key}`} className="text-sm font-semibold text-muted">
              {label}
              {required && !aiAvailable && <span className="text-bad"> *</span>}
            </label>
            <input
              id={`meal-${key}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              aria-invalid={errors[key] ? true : undefined}
              aria-describedby={errors[key] ? `meal-${key}-err` : undefined}
              className={`${input} ${errors[key] ? "ring-2 ring-bad" : ""}`}
            />
            {errors[key] && (
              <p id={`meal-${key}-err`} className="text-sm font-medium text-bad">
                {errors[key]}
              </p>
            )}
          </div>
        ))}
      </div>

      <FreeMealSwitch
        checked={values.isFree}
        blockedText={switchDisabled ? "Hai già usato il pasto libero in questa settimana: ce n'è uno solo." : null}
        slotName={slotName}
        freeMealCap={freeMealCap}
        error={errors.isFree}
        onChange={(v) => set("isFree", v)}
      />

      <button type="submit" disabled={saving} className="min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50">
        {submitLabel}
      </button>
      {onDelete && (
        <button type="button" onClick={() => setConfirming(true)} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-bad">
          Elimina piatto
        </button>
      )}
      {extra}
    </form>
  );
}
