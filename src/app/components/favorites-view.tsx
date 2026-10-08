"use client";

import { useEffect, useState } from "react";
import type { DateKey, Meal, MealSlot } from "@/engine";
import type { DataStore, FavoriteDish, FavoriteMeal, MealRecord } from "@/data";
import { filterByName, mealTotalKcal, recordsFromFavoriteDish, recordsFromFavoriteMeal } from "../lib/favorites";
import { formatNumber } from "../lib/format";
import { newId } from "../lib/ids";
import { SLOTS } from "../lib/meal-form";
import { isMealFree, saveDish } from "../lib/save-dish";
import { plural } from "../lib/plural";

interface Props {
  store: DataStore;
  date: DateKey;
  initialSlot?: MealSlot;
  dayDishes: readonly Pick<Meal, "id" | "slot" | "isFree">[];
  onChanged: () => void;
  onClose: () => void;
}

const input = "min-h-11 w-full rounded-xl bg-bg px-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent";

/** I preferiti (piatti e pasti salvati): si cercano per nome e un tocco li aggiunge al giorno, nella fascia scelta, senza AI. */
export function FavoritesView({ store, date, initialSlot, dayDishes, onChanged, onClose }: Props) {
  const [lists, setLists] = useState<{ dishes: FavoriteDish[]; meals: FavoriteMeal[] } | null>(null);
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<MealSlot>(initialSlot ?? "pranzo");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = () =>
    Promise.all([store.listFavoriteDishes(), store.listFavoriteMeals()])
      .then(([dishes, meals]) => setLists({ dishes, meals }))
      .catch(() => setLoadFailed(true));

  useEffect(() => {
    let alive = true;
    Promise.all([store.listFavoriteDishes(), store.listFavoriteMeals()])
      .then(([dishes, meals]) => alive && setLists({ dishes, meals }))
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, [store]);

  const add = async (records: MealRecord[]) => {
    if (busy) return;
    setBusy(true);
    try {
      const free = isMealFree(dayDishes, slot);
      for (const r of records) await saveDish(store, r, free);
      onChanged();
      onClose();
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega; si può riprovare.
    } finally {
      setBusy(false);
    }
  };

  const remove = async (kind: "dish" | "meal", id: string) => {
    setBusy(true);
    try {
      if (kind === "dish") await store.deleteFavoriteDish(id);
      else await store.deleteFavoriteMeal(id);
      setConfirmDelete(null);
      await load();
    } catch {
      // L'avviso in cima lo spiega.
    } finally {
      setBusy(false);
    }
  };

  if (loadFailed) return <p role="alert" className="rounded-xl bg-bg px-3 py-2.5 text-[15px] font-medium text-bad">Non riesco a leggere i preferiti. Chiudi e riprova.</p>;
  if (!lists) return <p className="text-[15px] text-muted" aria-busy="true">Carico i preferiti…</p>;

  const meals = filterByName(lists.meals, query);
  const dishes = filterByName(lists.dishes, query);
  const total = lists.meals.length + lists.dishes.length;

  const row = (kind: "dish" | "meal", id: string, name: string, detail: string, kcal: number, onAdd: () => void) => (
    <li key={`${kind}-${id}`} className="flex items-stretch border-t border-line first:border-t-0">
      <button type="button" disabled={busy} onClick={onAdd} aria-label={`Aggiungi ${name}`} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2 text-left disabled:opacity-50">
        <span className="min-w-0">
          <span className="block break-words text-[17px] font-semibold leading-snug">{name}</span>
          <span className="block break-words text-sm text-muted">{detail}</span>
        </span>
        <span className="shrink-0 text-[16px] tabular-nums text-muted">{formatNumber(kcal)} kcal</span>
      </button>
      {confirmDelete === `${kind}-${id}` ? (
        <button type="button" disabled={busy} onClick={() => remove(kind, id)} className="min-h-14 shrink-0 bg-bad-fill px-3 text-[15px] font-semibold text-white disabled:opacity-50">
          Elimina davvero
        </button>
      ) : (
        <button type="button" onClick={() => setConfirmDelete(`${kind}-${id}`)} aria-label={`Elimina ${name} dai preferiti`} className="min-h-14 min-w-11 shrink-0 px-3 text-[15px] font-semibold text-bad">
          Elimina
        </button>
      )}
    </li>
  );

  return (
    <div className="flex flex-col gap-4">
      {total === 0 ? (
        <p className="rounded-2xl bg-bg px-4 py-4 text-center text-[15px] text-muted">
          Nessun preferito. Tocca un piatto e scegli «Salva nei preferiti», oppure tocca l&apos;intestazione di un pasto per salvarlo intero.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fav-search" className="text-sm font-semibold text-muted">
              Cerca
            </label>
            <input id="fav-search" type="search" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome del piatto o del pasto" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span id="fav-slot" className="text-sm font-semibold text-muted">
              Aggiungi a
            </span>
            <div role="radiogroup" aria-labelledby="fav-slot" className="grid grid-cols-4 gap-1 rounded-xl bg-bg p-1">
              {SLOTS.map((s) => (
                <button key={s.value} type="button" role="radio" aria-checked={slot === s.value} onClick={() => setSlot(s.value)} className={`min-h-11 rounded-lg px-1 text-[15px] font-semibold ${slot === s.value ? "bg-accent text-white" : "text-fg"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {meals.length > 0 && (
            <section aria-label="Pasti salvati" className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Pasti</h3>
              <ul className="overflow-hidden rounded-2xl bg-bg">
                {meals.map((f) => row("meal", f.id, f.name, plural(f.dishes.length, "piatto", "piatti"), mealTotalKcal(f), () => add(recordsFromFavoriteMeal(f, date, slot, newId))))}
              </ul>
            </section>
          )}
          {dishes.length > 0 && (
            <section aria-label="Piatti salvati" className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Piatti</h3>
              <ul className="overflow-hidden rounded-2xl bg-bg">
                {dishes.map((f) => row("dish", f.id, f.name, f.quantity ?? "Senza quantità", f.kcal, () => add(recordsFromFavoriteDish(f, date, slot, newId))))}
              </ul>
            </section>
          )}
          {meals.length === 0 && dishes.length === 0 && <p className="px-1 text-[15px] text-muted">Nessun preferito con questo nome.</p>}
        </>
      )}
    </div>
  );
}
