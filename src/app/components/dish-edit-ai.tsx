"use client";

import { useState } from "react";
import { KCAL_CHECK_MESSAGE, parseDecimal, textNeedsKcalCheck } from "../lib/meal-form";
import type { MealFormValues } from "../lib/meal-form";
import { formatNumber } from "../lib/format";

interface Props {
  values: MealFormValues;
  busy: boolean;
  error: string | null;
  /** Nota del modello dopo l'ultima correzione (null prima di averne fatta una). */
  note: string | null;
  /** Corregge a parole il piatto aperto; restituisce se la stima è riuscita (il campo allora si svuota). */
  onCorrect: (correction: string) => Promise<boolean>;
}

const input = "min-h-11 w-full rounded-xl bg-bg px-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent";

const num = (t: string): string => {
  const r = parseDecimal(t);
  return r === "empty" || r === "invalid" ? "–" : formatNumber(r, Number.isInteger(r) ? 0 : 1);
};

/** Modo AI della scheda di un piatto già salvato: il piatto com'è adesso e un campo per correggerlo a parole ("era di più"). "Salva" è nell'intestazione. */
export function DishEditAi({ values, busy, error, note, onCorrect }: Props) {
  const [correction, setCorrection] = useState("");
  const check = note !== null && textNeedsKcalCheck(values);

  const submit = async () => {
    if (await onCorrect(correction)) setCorrection("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-bg p-3">
        <p className="break-words text-[17px] font-semibold leading-snug">{values.name.trim() || "Piatto"}</p>
        {values.quantity.trim() !== "" && <p className="mt-0.5 break-words text-sm text-muted">{values.quantity.trim()}</p>}
        <p className="mt-2 text-[17px] font-semibold tabular-nums">
          {num(values.kcal)} <span className="text-sm font-medium text-muted">kcal</span>
        </p>
        <p className="text-sm text-muted tabular-nums">
          Proteine {num(values.protein)} g · Carboidrati {num(values.carbs)} g · Grassi {num(values.fat)} g
        </p>
      </div>
      {note !== null && (
        <p role="status" className="rounded-xl bg-bg px-3 py-2.5 text-[15px]">
          <span className="font-semibold">Stima aggiornata: controlla i numeri.</span> {note}
        </p>
      )}
      {check && (
        <p role="status" className="rounded-xl bg-bg px-3 py-2.5 text-[15px] font-semibold text-warn">
          <span aria-hidden="true">⚠ </span>
          {KCAL_CHECK_MESSAGE}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="dish-correction" className="text-sm font-semibold text-muted">
          Correggi
        </label>
        <input id="dish-correction" type="text" autoComplete="off" value={correction} onChange={(e) => setCorrection(e.target.value)} className={input} />
        {error && (
          <p role="alert" className="text-[15px] font-medium text-bad">
            {error}
          </p>
        )}
        <button type="button" onClick={submit} disabled={busy || correction.trim() === ""} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent disabled:opacity-50">
          {busy ? "Sto stimando…" : "Rifai la stima"}
        </button>
      </div>
    </div>
  );
}
