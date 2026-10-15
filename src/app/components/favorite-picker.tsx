"use client";

import { useEffect, useState } from "react";
import type { DataStore, FavoriteDish, FavoriteMeal } from "@/data";
import { formatNumber } from "../lib/format";
import { deleteFavorite, favoriteRowActions, filterByName, mealTotalKcal } from "../lib/favorites";
import type { PickedFavorite } from "../lib/favorite-text";
import { plural } from "../lib/plural";
import { EditFavoritePanel } from "./edit-favorite-panel";
import { SwipeRow, useOpenRow } from "./swipe-row";
import { Caption, GroupedList } from "./ui/ui";

interface Props {
  store: DataStore;
  /** Il preferito scelto (piatto o pasto): va messo come etichetta nel campo «Cosa hai mangiato?». */
  onPick: (picked: PickedFavorite) => void;
}

/**
 * L'elenco dei preferiti, in due gruppi (Pasti e Piatti) con la ricerca: un tocco sulla riga mette l'etichetta nella frase (BRIEF §4.1).
 * Scorrendo una riga verso sinistra: «Modifica» (solo piatti) ed «Elimina», come tessere separate. È l'unico modo di riaggiungere un preferito.
 */
export function FavoritePicker({ store, onPick }: Props) {
  const [lists, setLists] = useState<{ dishes: FavoriteDish[]; meals: FavoriteMeal[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FavoriteDish | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = useOpenRow();

  const load = () =>
    Promise.all([store.listFavoriteDishes(), store.listFavoriteMeals()])
      .then(([dishes, meals]) => setLists({ dishes, meals }))
      .catch(() => setFailed(true));

  useEffect(() => {
    let alive = true;
    Promise.all([store.listFavoriteDishes(), store.listFavoriteMeals()]).then(
      ([dishes, meals]) => alive && setLists({ dishes, meals }),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [store]);

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

  if (failed) return <p role="alert" className="px-1 text-[15px] font-medium text-fuori">Non riesco a leggere i preferiti. Chiudi e riprova.</p>;
  if (!lists) return <p className="px-1 text-[15px] text-testo-secondario" aria-busy="true">Caricamento…</p>;
  if (lists.dishes.length === 0 && lists.meals.length === 0) return <p className="rounded-elenco bg-tessera px-4 py-4 text-center text-[15px] text-testo-secondario">Nessun preferito. Salvane uno da un piatto o da un pasto.</p>;

  const meals = filterByName(lists.meals, query);
  const dishes = filterByName(lists.dishes, query);

  const row = (kind: "dish" | "meal", id: string, name: string, detail: string | null, kcal: number, onChoose: () => void) => (
    <li key={`${kind}-${id}`}>
      <SwipeRow
        id={`${kind}-${id}`}
        openId={rows.openId}
        setOpen={rows.setOpen}
        actions={[
          // «Modifica» solo per i piatti: i pasti hanno solo «Elimina» (BRIEF §4.1).
          ...(favoriteRowActions(kind).includes("modifica") ? [{ key: "modifica", label: `Modifica ${name}`, visibleLabel: "Modifica", tone: "tessera" as const, onClick: () => setEditing(lists.dishes.find((f) => f.id === id) ?? null) }] : []),
          { key: "elimina", label: `Elimina ${name} dai preferiti`, visibleLabel: "Elimina", tone: "danger" as const, onClick: () => void remove(kind, id) },
        ]}
      >
        <button type="button" disabled={busy} onClick={onChoose} aria-label={`Metti ${name} nella frase`} className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 px-4 py-2 text-left disabled:opacity-50">
          <span className="min-w-0 flex-1">
            <span className="block break-words text-[17px] leading-snug">{name}</span>
            {detail && <span className="block break-words text-[13px] text-testo-secondario">{detail}</span>}
          </span>
          <span className="shrink-0 text-[13px] tabular-nums text-testo-secondario">{formatNumber(kcal)} kcal</span>
        </button>
      </SwipeRow>
    </li>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-full bg-tessera px-4">
        <input type="search" autoComplete="off" aria-label="Cerca" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca" className="min-h-11 w-full bg-transparent text-[17px] outline-none placeholder:text-testo-secondario" />
      </div>
      {meals.length > 0 && (
        <section aria-label="Pasti salvati" className="flex flex-col gap-2">
          <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-testo-secondario">Pasti</h3>
          <GroupedList>{meals.map((f) => row("meal", f.id, f.name, plural(f.dishes.length, "piatto", "piatti"), mealTotalKcal(f), () => onPick({ kind: "meal", favorite: f })))}</GroupedList>
        </section>
      )}
      {dishes.length > 0 && (
        <section aria-label="Piatti salvati" className="flex flex-col gap-2">
          <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-testo-secondario">Piatti</h3>
          <GroupedList>{dishes.map((f) => row("dish", f.id, f.name, f.quantity, f.kcal, () => onPick({ kind: "dish", favorite: f })))}</GroupedList>
        </section>
      )}
      {meals.length === 0 && dishes.length === 0 && <p className="px-1 text-[15px] text-testo-secondario">Nessun preferito con questo nome.</p>}
      <Caption>Tocca una riga per metterla nella frase. Scorrila verso sinistra per modificarla o eliminarla.</Caption>
      {editing && (
        <EditFavoritePanel
          favorite={editing}
          store={store}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
