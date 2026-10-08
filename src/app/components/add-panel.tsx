"use client";

import { useState } from "react";
import { hasFreeMealInWeek } from "@/engine";
import type { DateKey, Day, Settings } from "@/engine";
import type { DataStore, MealRecord } from "@/data";
import { copyMealsFromYesterday } from "../lib/copy-meals";
import { newId } from "../lib/ids";
import { emptyMealForm, mealToForm } from "../lib/meal-form";
import type { ParsedMeal } from "../lib/meal-form";
import { MealForm } from "./meal-form";
import { Sheet } from "./sheet";

interface PanelContext {
  store: DataStore;
  date: DateKey;
  days: readonly Day[];
  settings: Settings;
  /** Da chiamare dopo ogni modifica ai dati, per rileggere la schermata. */
  onChanged: () => void;
  onClose: () => void;
}

const chevron = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

function MenuRow({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left">
      <span>
        <span className="block text-[17px] font-semibold">{title}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      {chevron}
    </button>
  );
}

/** Pannello "Aggiungi", dal pulsante +. */
export function AddPanel(ctx: PanelContext) {
  const { store, date, days, settings, onChanged, onClose } = ctx;
  const [view, setView] = useState<"menu" | "pasto">("menu");
  const [note, setNote] = useState<string | null>(null);

  const saveMeal = async (parsed: ParsedMeal) => {
    const record: MealRecord = { id: newId(), date, originalText: null, ...parsed };
    await store.saveMeal(record);
    onChanged();
    onClose();
  };

  const copyFromYesterday = async () => {
    if ((await copyMealsFromYesterday(store, date)) === 0) {
      setNote("Ieri non ci sono pasti da copiare.");
      return;
    }
    onChanged();
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={view === "menu" ? "Aggiungi" : "Pasto a mano"}>
      {view === "menu" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-bg px-4 py-4 text-center text-[15px] text-muted">Inserimento a voce: in arrivo</div>
          <div className="overflow-hidden rounded-2xl bg-bg">
            <MenuRow title="Pasto a mano" hint="Scrivi tu nome, kcal e nutrienti" onClick={() => setView("pasto")} />
            <div className="border-t border-line" />
            <MenuRow title="Copia da ieri" hint="Rimetti i pasti di ieri, come pasti normali" onClick={copyFromYesterday} />
          </div>
          {note && (
            <p role="status" className="rounded-xl bg-bg px-4 py-3 text-[15px] font-medium">
              {note}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => setView("menu")} className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[17px] font-semibold text-accent">
            ‹ Indietro
          </button>
          <MealForm
            initial={emptyMealForm()}
            freeAllowed={!hasFreeMealInWeek(days)}
            freeMealCap={settings.freeMealCap}
            submitLabel="Aggiungi pasto"
            onSubmit={saveMeal}
          />
        </div>
      )}
    </Sheet>
  );
}

/** Pannello di modifica di un pasto, con eliminazione. */
export function EditMealPanel({ meal, ...ctx }: PanelContext & { meal: MealRecord }) {
  const { store, days, settings, onChanged, onClose } = ctx;

  const save = async (parsed: ParsedMeal) => {
    await store.saveMeal({ ...meal, ...parsed });
    onChanged();
    onClose();
  };
  const remove = async () => {
    await store.deleteMeal(meal.id);
    onChanged();
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title="Modifica pasto">
      <MealForm
        initial={mealToForm(meal)}
        freeAllowed={!hasFreeMealInWeek(days, meal.id)}
        freeMealCap={settings.freeMealCap}
        submitLabel="Salva"
        onSubmit={save}
        onDelete={remove}
        deleteName={meal.name}
      />
    </Sheet>
  );
}
