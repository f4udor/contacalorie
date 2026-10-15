"use client";

import { Caption, FieldRow, GroupedList, PillButton, RowInput, RowTextarea, SelectInput } from "./ui/ui";
import type { MealSlot } from "@/engine";
import { KCAL_CHECK_MESSAGE, SLOTS, textNeedsKcalCheck } from "../lib/meal-form";
import type { MealFieldKey, MealFormErrors, MealFormValues } from "../lib/meal-form";
import { aiEstimateHeadline, dishSheetFields } from "../lib/dish-sheet";

interface MealFormProps {
  values: MealFormValues;
  onChange: (patch: Partial<MealFormValues>) => void;
  errors: MealFormErrors;
  /** Dice se il pasto di quella fascia è già libero: scegliendo una fascia lo stato libero del pasto segue quello della fascia. */
  mealIsFreeFor?: (slot: MealSlot) => boolean;
  /** La fascia è già stabilita (si aggiunge un piatto a un pasto) e non si sceglie. */
  lockedSlot?: boolean;
  /** La stima automatica è attiva: compare "Stima con l'AI". */
  aiAvailable: boolean;
  aiBusy: boolean;
  aiError: string | null;
  /** Nota del modello dopo una stima (e, con essa, il controllo di coerenza). */
  aiNote: string | null;
  onEstimate: () => void;
  /** Il peso per cui sono state fatte le ultime stime con l'AI (null se la stima era senza peso). */
  aiForWeightG: number | null;
}

const NUMERIC: { key: Exclude<MealFieldKey, "isFree" | "weightG">; label: string; unit: string }[] = [
  { key: "kcal", label: "Calorie", unit: "kcal" },
  { key: "protein", label: "Proteine", unit: "g" },
  { key: "carbs", label: "Carboidrati", unit: "g" },
  { key: "fat", label: "Grassi", unit: "g" },
  { key: "fiber", label: "Fibre", unit: "g" },
  { key: "salt", label: "Sale", unit: "g" },
];

/**
 * Campi del piatto a mano (BRIEF §4.2), controllati da chi li usa: Nome, Peso (g), Ingredienti, «Stima con l'AI» (sopra le calorie), i numeri
 * e il pasto (solo se la fascia non è fissata). Il nome del campo sta a sinistra, il valore a destra con l'unità accanto.
 */
export function MealForm({ values, onChange, errors, mealIsFreeFor, lockedSlot = false, aiAvailable, aiBusy, aiError, aiNote, aiForWeightG, onEstimate }: MealFormProps) {
  const set = <K extends keyof MealFormValues>(key: K, value: MealFormValues[K]) => onChange({ [key]: value });
  return (
    <div className="flex flex-col gap-3">
      <GroupedList>
        <FieldRow label="Nome" htmlFor="meal-name">
          <RowInput id="meal-name" value={values.name} onChange={(v) => set("name", v)} />
        </FieldRow>
        <FieldRow label="Peso (g)" htmlFor="meal-weightG" error={errors.weightG}>
          <RowInput id="meal-weightG" value={values.weightG} onChange={(v) => set("weightG", v)} inputMode="numeric" placeholder="facoltativo" invalid={Boolean(errors.weightG)} />
        </FieldRow>
        <FieldRow label="Ingredienti" htmlFor="meal-quantity">
          <RowTextarea id="meal-quantity" value={values.quantity} onChange={(v) => set("quantity", v)} />
        </FieldRow>
      </GroupedList>

      {aiAvailable && (
        <>
          <PillButton onClick={onEstimate} disabled={aiBusy}>
            {aiBusy ? "Stima in corso…" : "Stima con l'AI"}
          </PillButton>
          {aiError && <Caption tone="fuori">{aiError}</Caption>}
        </>
      )}
      {aiNote !== null && values.kcal.trim() !== "" && (
        <p role="status" className="px-4 text-[13px] text-testo-secondario">
          <span className="font-semibold text-testo">{aiEstimateHeadline(aiForWeightG)}</span> {aiNote}
        </p>
      )}
      {aiNote !== null && textNeedsKcalCheck(values) && (
        <Caption tone="attenzione">
          <span role="status">
            <span aria-hidden="true">⚠ </span>
            {KCAL_CHECK_MESSAGE}
          </span>
        </Caption>
      )}

      <GroupedList>
        {NUMERIC.map(({ key, label, unit }) => (
          <FieldRow key={key} label={label} htmlFor={`meal-${key}`} unit={unit} error={errors[key]}>
            <RowInput id={`meal-${key}`} value={values[key]} onChange={(v) => set(key, v)} inputMode="decimal" invalid={Boolean(errors[key])} />
          </FieldRow>
        ))}
      </GroupedList>

      {dishSheetFields(lockedSlot).includes("pasto") && (
        <GroupedList>
          <FieldRow label="Pasto" htmlFor="meal-slot">
            <SelectInput
              id="meal-slot"
              value={values.slot}
              options={SLOTS}
              onChange={(slot) => {
                set("slot", slot);
                if (mealIsFreeFor) set("isFree", mealIsFreeFor(slot));
              }}
            />
          </FieldRow>
        </GroupedList>
      )}

    </div>
  );
}
