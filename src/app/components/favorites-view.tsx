"use client";

import { useEffect, useState } from "react";
import type { DateKey, Meal, MealSlot } from "@/engine";
import type { DataStore, FavoriteDish, FavoriteMeal, MealRecord } from "@/data";
import { deleteFavorite, filterByName, mealTotalKcal, recordsFromFavoriteDish, recordsFromFavoriteMeal } from "../lib/favorites";
import { formatNumber } from "../lib/format";
import { newId } from "../lib/ids";
import { SLOTS } from "../lib/meal-form";
import { isMealFree, saveDish } from "../lib/save-dish";
import { plural } from "../lib/plural";
import { SwipeRow, useOpenRow } from "./swipe-row";
import { IconPlus } from "./ui/icons";
import { Caption, GroupedList, Segmented } from "./ui/ui";

interface Props {
  store: DataStore;
  date: DateKey;
  initialSlot?: MealSlot;
  dayDishes: readonly Pick<Meal, "id" | "slot" | "isFree">[];
  onChanged: () => void;
  onClose: () => void;
}

/** I preferiti (piatti e pasti salvati): si cercano per nome e un tocco li aggiunge al giorno, nella fascia scelta, senza AI. */
export function FavoritesView({ store, date, initialSlot, dayDishes, onChanged, onClose }: Props) {
  const [lists, setLists] = useState<{ dishes: FavoriteDish[]; meals: FavoriteMeal[] } | null>(null);
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<MealSlot>(initialSlot ?? "pranzo");
  const [busy, setBusy] = useState(false);
  const rows = useOpenRow();
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
      await deleteFavorite(store, kind, id);
      await load();
    } catch {
      // L'avviso in cima lo spiega.
    } finally {
      setBusy(false);
    }
  };

  if (loadFailed) return <p role="alert" className="px-1 text-[15px] font-medium text-fuori">Non riesco a leggere i preferiti. Chiudi e riprova.</p>;
  if (!lists) return <p className="px-1 text-[15px] text-testo-secondario" aria-busy="true">Caricamento…</p>;

  const meals = filterByName(lists.meals, query);
  const dishes = filterByName(lists.dishes, query);
  const total = lists.meals.length + lists.dishes.length;

  const plus = (
    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-comando/20 text-comando">
      <IconPlus size={18} strokeWidth={2.4} />
    </span>
  );

  const row = (kind: "dish" | "meal", id: string, name: string, detail: string | null, kcal: number, onAdd: () => void) => (
    <li key={`${kind}-${id}`}>
      <SwipeRow
        id={`${kind}-${id}`}
        openId={rows.openId}
        setOpen={rows.setOpen}
        actions={[{ key: "elimina", label: `Elimina ${name} dai preferiti`, visibleLabel: "Elimina", tone: "danger", onClick: () => void remove(kind, id) }]}
      >
        <button type="button" disabled={busy} onClick={onAdd} aria-label={`Aggiungi ${name}`} className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 px-4 py-2 text-left disabled:opacity-50">
          <span className="min-w-0 flex-1">
            <span className="block break-words text-[17px] leading-snug">{name}</span>
            {detail && <span className="block break-words text-[13px] text-testo-secondario">{detail}</span>}
          </span>
          <span className="shrink-0 text-[13px] tabular-nums text-testo-secondario">{formatNumber(kcal)} kcal</span>
          {plus}
        </button>
      </SwipeRow>
    </li>
  );

  return (
    <div className="flex flex-col gap-4">
      {total === 0 ? (
        <p className="rounded-elenco bg-tessera px-4 py-4 text-center text-[15px] text-testo-secondario">Nessun preferito. Salvane uno da un piatto o da un pasto.</p>
      ) : (
        <>
          <div className="rounded-full bg-tessera px-4">
            <input id="fav-search" type="search" autoComplete="off" aria-label="Cerca" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca" className="min-h-11 w-full bg-transparent text-[17px] outline-none placeholder:text-testo-secondario" />
          </div>
          {!initialSlot && <Segmented label="Aggiungi a" options={SLOTS} value={slot} onChange={setSlot} />}
          {meals.length > 0 && (
            <section aria-label="Pasti salvati" className="flex flex-col gap-2">
              <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-testo-secondario">Pasti</h3>
              <GroupedList>{meals.map((f) => row("meal", f.id, f.name, `${plural(f.dishes.length, "piatto", "piatti")}`, mealTotalKcal(f), () => add(recordsFromFavoriteMeal(f, date, slot, newId))))}</GroupedList>
            </section>
          )}
          {dishes.length > 0 && (
            <section aria-label="Piatti salvati" className="flex flex-col gap-2">
              <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-testo-secondario">Piatti</h3>
              <GroupedList>{dishes.map((f) => row("dish", f.id, f.name, f.quantity, f.kcal, () => add(recordsFromFavoriteDish(f, date, slot, newId))))}</GroupedList>
            </section>
          )}
          {meals.length === 0 && dishes.length === 0 && <p className="px-1 text-[15px] text-testo-secondario">Nessun preferito con questo nome.</p>}
          <Caption>Scorri una riga verso sinistra per eliminarla.</Caption>
        </>
      )}
    </div>
  );
}
