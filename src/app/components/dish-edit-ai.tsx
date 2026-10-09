"use client";

import { useState } from "react";
import { KCAL_CHECK_MESSAGE, parseDecimal, textNeedsKcalCheck } from "../lib/meal-form";
import type { MealFormValues } from "../lib/meal-form";
import { formatNumber } from "../lib/format";
import { Caption, PillButton, Tile } from "./ui/ui";

interface Props {
  values: MealFormValues;
  busy: boolean;
  error: string | null;
  /** Nota del modello dopo l'ultima correzione (null prima di averne fatta una). */
  note: string | null;
  /** Corregge a parole il piatto aperto; restituisce se la stima è riuscita (il campo allora si svuota). */
  onCorrect: (correction: string) => Promise<boolean>;
}

const num = (t: string): string => {
  const r = parseDecimal(t);
  return r === "empty" || r === "invalid" ? "–" : formatNumber(r, Number.isInteger(r) ? 0 : 1);
};

/** Modo AI della scheda di un piatto già salvato: il piatto com'è adesso e un campo per correggerlo a parole («era di più»). «Salva» è nell'intestazione. */
export function DishEditAi({ values, busy, error, note, onCorrect }: Props) {
  const [correction, setCorrection] = useState("");
  const check = note !== null && textNeedsKcalCheck(values);

  const submit = async () => {
    if (await onCorrect(correction)) setCorrection("");
  };

  return (
    <div className="flex flex-col gap-3">
      <Tile className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block break-words text-[16px] leading-snug">{values.name.trim() || "Piatto"}</span>
            {values.quantity.trim() !== "" && <span className="block break-words text-[13px] text-testo-secondario">{values.quantity.trim()}</span>}
          </span>
          <span className="shrink-0 font-cifre text-[17px] tabular-nums">{num(values.kcal)}</span>
        </div>
        <p className="mt-2 text-[13px] tabular-nums text-testo-secondario">
          Proteine {num(values.protein)} g · Carboidrati {num(values.carbs)} g · Grassi {num(values.fat)} g
        </p>
      </Tile>
      {note !== null && (
        <p role="status" className="px-4 text-[13px] text-testo-secondario">
          <span className="font-semibold text-testo">Stima aggiornata: controlla i numeri.</span> {note}
        </p>
      )}
      {check && (
        <p role="status" className="px-4 text-[13px] font-semibold text-attenzione">
          <span aria-hidden="true">⚠ </span>
          {KCAL_CHECK_MESSAGE}
        </p>
      )}
      <div className="rounded-elenco bg-tessera px-4 py-3">
        <label htmlFor="dish-correction" className="sr-only">
          Correggi a parole
        </label>
        <textarea id="dish-correction" rows={3} value={correction} placeholder="Correggi a parole" onChange={(e) => setCorrection(e.target.value)} className="w-full resize-none bg-transparent text-[17px] outline-none placeholder:text-testo-secondario" />
      </div>
      {error && <Caption tone="fuori">{error}</Caption>}
      <PillButton onClick={submit} disabled={busy || correction.trim() === ""}>
        {busy ? "Stima in corso…" : "Rifai la stima"}
      </PillButton>
    </div>
  );
}
