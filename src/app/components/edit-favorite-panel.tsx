"use client";

import { useState } from "react";
import type { DataStore, FavoriteDish } from "@/data";
import { canSaveDish } from "../lib/dish-sheet";
import { favoriteFromForm, favoriteToForm } from "../lib/favorites";
import { useDishForm } from "../lib/use-dish-form";
import { DishEditAi } from "./dish-edit-ai";
import { MealForm } from "./meal-form";
import { Sheet } from "./sheet";
import { Segmented } from "./ui/ui";

type Mode = "ai" | "manuale";

const MODES = [
  { value: "ai", label: "AI" },
  { value: "manuale", label: "Manuale" },
] as const;

/**
 * «Modifica preferito» (BRIEF §4.1): la scheda del piatto di §4.2 senza la riga Pasto e senza «Salva nei preferiti» ed «Elimina piatto».
 * «Salva» aggiorna il preferito; i piatti già registrati non cambiano.
 */
export function EditFavoritePanel({ favorite, store, onClose, onSaved }: { favorite: FavoriteDish; store: DataStore; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<Mode>("manuale");
  const [saving, setSaving] = useState(false);
  const initial = favoriteToForm(favorite);
  const form = useDishForm(initial, () => true);

  const save = async () => {
    if (saving) return;
    const parsed = form.validate();
    if (!parsed) {
      setMode("manuale");
      return;
    }
    setSaving(true);
    try {
      await store.saveFavoriteDish(favoriteFromForm(favorite.id, parsed));
      onSaved();
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e la scheda resta com'è, per riprovare.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Modifica preferito"
      tall
      bar={{ onSave: () => void save(), saveDisabled: saving || form.busy || !canSaveDish(form.values, initial) }}
      subHeader={<Segmented label="Modo di inserimento" options={MODES} value={mode} onChange={setMode} />}
    >
      <div className={mode === "manuale" ? "" : "hidden"}>
        <MealForm idPrefix="fav-edit" values={form.values} onChange={form.patch} errors={form.errors} lockedSlot aiAvailable={form.aiAvailable} aiBusy={form.busy} aiError={form.aiError} aiNote={form.aiNote} aiForWeightG={form.aiForWeightG} onEstimate={form.estimate} />
      </div>
      {mode === "ai" && <DishEditAi values={form.values} busy={form.busy} error={form.aiError} note={form.aiNote} onCorrect={form.correct} />}
    </Sheet>
  );
}
