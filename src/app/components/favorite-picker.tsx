"use client";

import { useEffect, useState } from "react";
import type { DataStore, FavoriteDish } from "@/data";
import { formatNumber } from "../lib/format";
import { filterByName } from "../lib/favorites";
import { IconPlus } from "./ui/icons";
import { GroupedList } from "./ui/ui";

interface Props {
  store: DataStore;
  /** Il preferito scelto: va messo come etichetta nel campo «Cosa hai mangiato?». */
  onPick: (favorite: FavoriteDish) => void;
}

/** L'elenco dei piatti preferiti con la ricerca, nello stile del pannello Preferiti: scegliendone uno diventa un'etichetta nella frase. */
export function FavoritePicker({ store, onPick }: Props) {
  const [dishes, setDishes] = useState<FavoriteDish[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    store.listFavoriteDishes().then(
      (list) => alive && setDishes(list),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [store]);

  if (failed) return <p role="alert" className="px-1 text-[15px] font-medium text-fuori">Non riesco a leggere i preferiti. Chiudi e riprova.</p>;
  if (!dishes) return <p className="px-1 text-[15px] text-testo-secondario" aria-busy="true">Caricamento…</p>;
  if (dishes.length === 0) return <p className="rounded-elenco bg-tessera px-4 py-4 text-center text-[15px] text-testo-secondario">Nessun preferito. Salvane uno da un piatto.</p>;

  const shown = filterByName(dishes, query);
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-full bg-tessera px-4">
        <input type="search" autoComplete="off" aria-label="Cerca" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca" className="min-h-11 w-full bg-transparent text-[17px] outline-none placeholder:text-testo-secondario" />
      </div>
      <section aria-label="Piatti preferiti" className="flex flex-col gap-2">
        <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-testo-secondario">Piatti</h3>
        {shown.length === 0 ? (
          <p className="px-1 text-[15px] text-testo-secondario">Nessun piatto trovato.</p>
        ) : (
          <GroupedList>
            {shown.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => onPick(f)} aria-label={`Metti ${f.name} nella frase`} className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 px-4 py-2 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[17px] leading-snug">{f.name}</span>
                    {f.quantity && <span className="block break-words text-[13px] text-testo-secondario">{f.quantity}</span>}
                  </span>
                  <span className="shrink-0 text-[13px] tabular-nums text-testo-secondario">{formatNumber(f.kcal)} kcal</span>
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-comando/20 text-comando">
                    <IconPlus size={18} strokeWidth={2.4} />
                  </span>
                </button>
              </li>
            ))}
          </GroupedList>
        )}
      </section>
    </div>
  );
}
