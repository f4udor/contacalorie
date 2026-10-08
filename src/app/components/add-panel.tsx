"use client";

import { useState } from "react";
import { hasFreeMealInWeek } from "@/engine";
import type { DateKey, Day, MealSlot, Settings } from "@/engine";
import type { ActivityRecord, DataStore, MealRecord } from "@/data";
import { copyMealsFromYesterday } from "../lib/copy-meals";
import { defaultMealName, favoriteForDish, favoriteForMeal } from "../lib/favorites";
import { newId } from "../lib/ids";
import { isMealFree, saveDish } from "../lib/save-dish";
import { buildActivityRecord } from "../lib/activity-form";
import type { ParsedActivity } from "../lib/activity-form";
import { emptyMealForm, mealToForm } from "../lib/meal-form";
import type { ParsedMeal } from "../lib/meal-form";
import { ActivityForm, WeightForm } from "./activity-forms";
import { AiEstimate } from "./ai-estimate";
import { FavoritesView } from "./favorites-view";
import { MealForm } from "./meal-form";
import { Sheet } from "./sheet";

interface PanelContext {
  store: DataStore;
  date: DateKey;
  days: readonly Day[];
  settings: Settings;
  /** Attività già salvata per il giorno, se c'è. */
  activity: ActivityRecord | null;
  /** Peso già salvato per il giorno, se c'è. */
  weightKg: number | null;
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

const SLOT_NAME: Record<MealSlot, string> = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", spuntino: "Spuntino" };
const TITLES = { menu: "Aggiungi", pasto: "Piatto a mano", attivita: "Attività a mano", pesata: "Pesata", preferiti: "Preferiti" } as const;

/** Pannello "Aggiungi", dal pulsante +. */
export function AddPanel(ctx: PanelContext & { initialSlot?: MealSlot }) {
  const { store, date, days, settings, activity, weightKg, onChanged, onClose, initialSlot } = ctx;
  const [view, setView] = useState<"menu" | "pasto" | "attivita" | "pesata" | "preferiti">(initialSlot ? "pasto" : "menu");
  const freeAllowedFor = (slot: MealSlot) => !hasFreeMealInWeek(days, { date, slot });
  const dayDishes = days.find((d) => d.date === date)?.meals ?? [];
  const existingFree = (slot: MealSlot) => isMealFree(dayDishes, slot);
  const [note, setNote] = useState<string | null>(null);

  const saveMeal = async (parsed: ParsedMeal) => {
    const { isFree, ...dishFields } = parsed;
    const record: MealRecord = { id: newId(), date, originalText: null, isFree, ...dishFields };
    await saveDish(store, record, isFree);
    onChanged();
    onClose();
  };

  const saveActivity = async (parsed: ParsedActivity) => {
    await store.saveActivity(buildActivityRecord(date, parsed, activity));
    onChanged();
    onClose();
  };

  const saveWeight = async (kg: number) => {
    await store.saveWeighIn({ date, weightKg: kg });
    onChanged();
    onClose();
  };

  const copyFromYesterday = async () => {
    try {
      if ((await copyMealsFromYesterday(store, date)) === 0) {
        setNote("Ieri non ci sono piatti da copiare.");
        return;
      }
    } catch {
      return; // non copiato (o copiato solo in parte): l'avviso in cima lo spiega
    }
    onChanged();
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={initialSlot && view === "pasto" ? `Piatto · ${SLOT_NAME[initialSlot]}` : TITLES[view]}>
      {view === "menu" ? (
        <AiEstimate store={store} date={date} dayDishes={dayDishes} onChanged={onChanged} onClose={onClose}>
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-2xl bg-bg">
              <MenuRow title="Preferiti" hint="Piatti e pasti che hai salvato" onClick={() => setView("preferiti")} />
              <div className="border-t border-line" />
              <MenuRow title="Piatto a mano" hint="Scrivi tu nome, kcal e nutrienti" onClick={() => setView("pasto")} />
              <div className="border-t border-line" />
              <MenuRow title="Copia da ieri" hint="Rimetti i piatti di ieri, come pasto normale" onClick={copyFromYesterday} />
            </div>
            <div className="overflow-hidden rounded-2xl bg-bg">
              <MenuRow title="Attività a mano" hint="Passi, km e kcal della bici" onClick={() => setView("attivita")} />
              <div className="border-t border-line" />
              <MenuRow title="Pesata" hint="Il tuo peso di oggi, in kg" onClick={() => setView("pesata")} />
            </div>
            {note && (
              <p role="status" className="rounded-xl bg-bg px-4 py-3 text-[15px] font-medium">
                {note}
              </p>
            )}
          </div>
        </AiEstimate>
      ) : (
        <div className="flex flex-col gap-3">
          {!(initialSlot && view === "pasto") && (
            <button type="button" onClick={() => setView("menu")} className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[17px] font-semibold text-accent">
              ‹ Indietro
            </button>
          )}
          {view === "pasto" && (
            <MealForm
              initial={{ ...emptyMealForm(initialSlot), isFree: existingFree(initialSlot ?? emptyMealForm().slot) }}
              freeAllowedFor={freeAllowedFor}
              mealIsFreeFor={existingFree}
              lockedSlot={initialSlot !== undefined}
              freeMealCap={settings.freeMealCap}
              submitLabel="Aggiungi piatto"
              onSubmit={saveMeal}
            />
          )}
          {view === "preferiti" && <FavoritesView store={store} date={date} initialSlot={initialSlot} dayDishes={dayDishes} onChanged={onChanged} onClose={onClose} />}
          {view === "attivita" && <ActivityForm existing={activity} kcalPerKm={settings.kcalPerKm} onSubmit={saveActivity} />}
          {view === "pesata" && <WeightForm existingKg={weightKg} onSubmit={saveWeight} />}
        </div>
      )}
    </Sheet>
  );
}

/** Pannello di modifica di un pasto, con eliminazione. */
export function EditMealPanel({ meal, ...ctx }: PanelContext & { meal: MealRecord }) {
  const { store, days, settings, onChanged, onClose } = ctx;
  const [favoriteStatus, setFavoriteStatus] = useState<string | null>(null);

  const saveFavorite = async () => {
    try {
      const { favorite, updated } = favoriteForDish(await store.listFavoriteDishes(), meal, newId);
      await store.saveFavoriteDish(favorite);
      setFavoriteStatus(updated ? "Preferito aggiornato." : "Salvato nei preferiti.");
    } catch {
      // L'avviso in cima lo spiega; si può riprovare.
    }
  };

  const save = async (parsed: ParsedMeal) => {
    const { isFree, ...dishFields } = parsed;
    await saveDish(store, { ...meal, isFree, ...dishFields }, isFree);
    onChanged();
    onClose();
  };
  const remove = async () => {
    await store.deleteMeal(meal.id);
    onChanged();
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title="Modifica piatto">
      <MealForm
        initial={mealToForm(meal)}
        freeAllowedFor={(slot) => !hasFreeMealInWeek(days, { date: meal.date, slot })}
        mealIsFreeFor={(slot) => isMealFree(days.find((d) => d.date === meal.date)?.meals ?? [], slot, meal.id)}
        freeMealCap={settings.freeMealCap}
        submitLabel="Salva"
        onSubmit={save}
        onDelete={remove}
        deleteName={meal.name}
        extra={
          <div className="flex flex-col gap-2">
            <button type="button" onClick={saveFavorite} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
              Salva nei preferiti
            </button>
            {favoriteStatus && (
              <p role="status" className="text-center text-[15px] font-semibold text-ok">
                {favoriteStatus}
              </p>
            )}
          </div>
        }
      />
    </Sheet>
  );
}

/** Pannello di modifica dell'attività del giorno, aperto dalla scheda Attività. */
export function EditActivityPanel(ctx: PanelContext) {
  const { store, date, settings, activity, onChanged, onClose } = ctx;
  const save = async (parsed: ParsedActivity) => {
    await store.saveActivity(buildActivityRecord(date, parsed, activity));
    onChanged();
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="Attività a mano">
      <ActivityForm existing={activity} kcalPerKm={settings.kcalPerKm} onSubmit={save} />
    </Sheet>
  );
}

/** Pannello per salvare un pasto intero nei preferiti, con un nome modificabile. */
export function SaveMealPanel({ slot, ...ctx }: PanelContext & { slot: MealSlot }) {
  const { store, date, days, onClose } = ctx;
  const dishes = (days.find((d) => d.date === date)?.meals ?? []).filter((m) => m.slot === slot) as MealRecord[];
  const [name, setName] = useState(() => defaultMealName(dishes));
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { favorite, updated } = favoriteForMeal(await store.listFavoriteMeals(), name, slot, dishes, newId);
      await store.saveFavoriteMeal(favorite);
      setStatus(updated ? "Pasto aggiornato nei preferiti." : "Pasto salvato nei preferiti.");
    } catch {
      // L'avviso in cima lo spiega; si può riprovare.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={`Salva pasto · ${SLOT_NAME[slot]}`}>
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <p className="text-[15px] text-muted">Salva tutti i piatti di questo pasto ({dishes.length}) per rimetterli in un tocco.</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fav-meal-name" className="text-sm font-semibold text-muted">
            Nome del pasto
          </label>
          <input id="fav-meal-name" type="text" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 w-full rounded-xl bg-bg px-3 text-[17px] outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <button type="submit" disabled={busy || dishes.length === 0} className="min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50">
          Salva pasto
        </button>
        {status && (
          <p role="status" className="text-center text-[15px] font-semibold text-ok">
            {status}
          </p>
        )}
      </form>
    </Sheet>
  );
}
