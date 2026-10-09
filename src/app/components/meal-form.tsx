"use client";

import { FreeMealSwitch } from "./free-meal-switch";
import { Caption, FieldRow, GroupedList, PillButton, RowInput, RowTextarea, SelectInput } from "./ui/ui";
import type { MealSlot } from "@/engine";
import { KCAL_CHECK_MESSAGE, SLOTS, textNeedsKcalCheck } from "../lib/meal-form";
import type { MealFieldKey, MealFormErrors, MealFormValues } from "../lib/meal-form";

interface MealFormProps {
  values: MealFormValues;
  onChange: (patch: Partial<MealFormValues>) => void;
  errors: MealFormErrors;
  /** Dice se il pasto di quella fascia può essere libero (false se la settimana ha già un altro pasto libero). */
  freeAllowedFor: (slot: MealSlot) => boolean;
  /** Dice se il pasto di quella fascia è già libero: scegliendo una fascia l'interruttore ne segue lo stato. */
  mealIsFreeFor?: (slot: MealSlot) => boolean;
  /** La fascia è già stabilita (si aggiunge un piatto a un pasto) e non si sceglie. */
  lockedSlot?: boolean;
  /** Tetto di kcal del pasto libero, dalle impostazioni. */
  freeMealCap: number;
  /** La stima automatica è attiva: compare "Stima con l'AI". */
  aiAvailable: boolean;
  aiBusy: boolean;
  aiError: string | null;
  /** Nota del modello dopo una stima (e, con essa, il controllo di coerenza). */
  aiNote: string | null;
  onEstimate: () => void;
}

const NUMERIC: { key: Exclude<MealFieldKey, "isFree">; label: string; unit: string }[] = [
  { key: "kcal", label: "Calorie", unit: "kcal" },
  { key: "protein", label: "Proteine", unit: "g" },
  { key: "carbs", label: "Carboidrati", unit: "g" },
  { key: "fat", label: "Grassi", unit: "g" },
  { key: "fiber", label: "Fibre", unit: "g" },
  { key: "salt", label: "Sale", unit: "g" },
];

/**
 * Campi del piatto a mano (BRIEF §10.5, bozza «scheda del piatto»), controllati da chi li usa: nome e quantità, «Stima con l'AI» (sopra le
 * calorie), i numeri, il pasto e l'interruttore «Pasto libero». Il nome del campo sta a sinistra, il valore a destra con l'unità accanto.
 */
export function MealForm({ values, onChange, errors, freeAllowedFor, mealIsFreeFor, lockedSlot = false, freeMealCap, aiAvailable, aiBusy, aiError, aiNote, onEstimate }: MealFormProps) {
  const set = <K extends keyof MealFormValues>(key: K, value: MealFormValues[K]) => onChange({ [key]: value });
  // Se il pasto è già libero resta modificabile anche quando la settimana «ne ha» uno: è proprio quello.
  const freeAllowed = freeAllowedFor(values.slot);
  const switchDisabled = !freeAllowed && !values.isFree;

  return (
    <div className="flex flex-col gap-3">
      <GroupedList>
        <FieldRow label="Nome" htmlFor="meal-name">
          <RowInput id="meal-name" value={values.name} onChange={(v) => set("name", v)} />
        </FieldRow>
        <FieldRow label="Quantità" htmlFor="meal-quantity">
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
          <span className="font-semibold text-testo">Stimato con l&apos;AI: controlla i numeri.</span> {aiNote}
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

      {!lockedSlot && (
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

      <FreeMealSwitch
        checked={values.isFree}
        blockedText={switchDisabled ? "Già usato questa settimana." : null}
        freeMealCap={freeMealCap}
        error={errors.isFree}
        onChange={(v) => set("isFree", v)}
      />
    </div>
  );
}
