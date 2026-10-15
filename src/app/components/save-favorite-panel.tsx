"use client";

import { useState } from "react";
import type { DataStore, DishBody, MealRecord } from "@/data";
import { newId } from "../lib/ids";
import { parseFavoriteWeight, saveFavoriteDishAs } from "../lib/favorites";
import { FieldRow, GroupedList, RowInput } from "./ui/ui";
import { Sheet } from "./sheet";

interface Props {
  store: DataStore;
  dish: Pick<MealRecord, keyof DishBody>;
  onClose: () => void;
  /** Dopo il salvataggio. */
  onSaved: () => void;
}

/** Pannello piccolo «Salva nei preferiti» per un piatto senza peso: il nome e il peso, facoltativo (BRIEF §4.1). «Salva» funziona anche con il peso vuoto. */
export function SaveFavoritePanel({ store, dish, onClose, onSaved }: Props) {
  const [name, setName] = useState(dish.name);
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    const w = parseFavoriteWeight(weight);
    if (!w.ok) {
      setError("Inserisci un peso in grammi (numero intero)");
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await saveFavoriteDishAs(store, dish, name, w.weightG, newId);
      onSaved();
    } catch {
      // L'avviso in cima lo spiega; si può riprovare.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Salva nei preferiti" bar={{ onSave: () => void save(), saveDisabled: busy }}>
      <GroupedList>
        <FieldRow label="Nome" htmlFor="fav-name">
          <RowInput id="fav-name" value={name} onChange={setName} />
        </FieldRow>
        <FieldRow label="Peso (g)" htmlFor="fav-weight" error={error}>
          <RowInput id="fav-weight" value={weight} onChange={setWeight} inputMode="numeric" placeholder="facoltativo" invalid={Boolean(error)} />
        </FieldRow>
      </GroupedList>
    </Sheet>
  );
}
