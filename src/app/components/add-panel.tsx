"use client";

import { useEffect, useRef, useState } from "react";
import { hasFreeMealInWeek } from "@/engine";
import type { DateKey, Day, MealSlot, Settings } from "@/engine";
import type { ActivityRecord, DataStore, MealRecord } from "@/data";
import { defaultMealName, favoriteForMeal, isFavoriteDish, toggleFavoriteDish } from "../lib/favorites";
import { newId } from "../lib/ids";
import { isMealFree, saveDish } from "../lib/save-dish";
import { todayKey } from "../lib/today";
import { canSaveDish } from "../lib/dish-sheet";
import { emptyMealForm, mealToForm } from "../lib/meal-form";
import { useDishForm } from "../lib/use-dish-form";
import type { ParsedMeal } from "../lib/meal-form";
import { BikeEntry, WeightForm } from "./activity-forms";
import { AiEstimate } from "./ai-estimate";
import type { AiEstimateHandle } from "./ai-estimate";
import { DishEditAi } from "./dish-edit-ai";
import { FavoritesView } from "./favorites-view";
import { MealForm } from "./meal-form";
import { DateInput, FieldRow, GroupedList, PillButton, RowInput, Segmented, ActionRow, ValueRow } from "./ui/ui";
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

const SLOT_NAME: Record<MealSlot, string> = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", spuntino: "Spuntino" };
const SUB_TITLES = { bici: "Uscita in bici", pesata: "Pesata", preferiti: "Preferiti" } as const;

type Mode = "ai" | "manuale";

const MODES = [
  { value: "ai", label: "AI" },
  { value: "manuale", label: "Manuale" },
] as const;

/**
 * Pannello "Aggiungi", dal pulsante +. Si apre su "AI"; "Manuale" è il piatto a mano. Con `initialSlot` (da "+ Aggiungi piatto"
 * di un pasto) il titolo è la fascia, che è fissata, e sotto resta solo "Preferiti".
 */
export function AddPanel(ctx: PanelContext & { initialSlot?: MealSlot; /** Aperto da «Aggiungi pasto libero»: l'interruttore parte acceso e il giorno si può cambiare tra quelli indicati. */ freeMeal?: { days: readonly DateKey[] } }) {
  const { store, date: initialDate, days, settings, weightKg, onChanged, onClose, initialSlot, freeMeal } = ctx;
  const [date, setDate] = useState<DateKey>(initialDate);
  const [mode, setMode] = useState<Mode>("ai");
  const [view, setView] = useState<"main" | "bici" | "pesata" | "preferiti">("main");
  const freeAllowedFor = (slot: MealSlot) => !hasFreeMealInWeek(days, { date, slot });
  const dayDishes = days.find((d) => d.date === date)?.meals ?? [];
  const existingFree = (slot: MealSlot) => isMealFree(dayDishes, slot);
  const form = useDishForm({ ...emptyMealForm(initialSlot), isFree: existingFree(initialSlot ?? emptyMealForm().slot) || (freeMeal !== undefined && freeAllowedFor(initialSlot ?? emptyMealForm().slot)) }, freeAllowedFor);
  const aiHandle = useRef<AiEstimateHandle | null>(null);
  const [aiCanSave, setAiCanSave] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveMeal = async (parsed: ParsedMeal) => {
    const { isFree, ...dishFields } = parsed;
    const record: MealRecord = { id: newId(), date, originalText: null, isFree, ...dishFields };
    await saveDish(store, record, isFree);
    onChanged();
    onClose();
  };

  /** "Salva" dell'intestazione: conferma la proposta (AI) o salva il piatto scritto (Manuale). */
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "ai") await aiHandle.current?.confirm();
      else {
        const parsed = form.validate();
        if (parsed) await saveMeal(parsed);
      }
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e la scheda resta com'è, per riprovare.
    } finally {
      setSaving(false);
    }
  };

  const saveWeight = async (kg: number) => {
    await store.saveWeighIn({ date, weightKg: kg });
    onChanged();
    onClose();
  };

  const title = view === "main" ? (initialSlot ? `Aggiungi a ${SLOT_NAME[initialSlot].toLowerCase()}` : "Aggiungi") : SUB_TITLES[view];
  const menu = (
    <div className="flex flex-col gap-3">
      <GroupedList>
        <ValueRow title="Preferiti" onClick={() => setView("preferiti")} />
      </GroupedList>
      {!initialSlot && (
        <GroupedList>
          <ValueRow title="Pesata" onClick={() => setView("pesata")} />
          <ValueRow title="Uscita in bici" onClick={() => setView("bici")} />
        </GroupedList>
      )}
    </div>
  );
  const bar =
    view === "main"
      ? { onSave: () => void save(), saveDisabled: saving || form.busy || !(mode === "ai" ? aiCanSave : canSaveDish(form.values, null)) }
      : view === "bici"
        ? { formId: "bike-form" }
        : view === "pesata"
          ? { formId: "weight-form" }
          : {};

  return (
    // Dalle sotto-schermate la X torna alla schermata principale; dalla principale chiude il pannello.
    <Sheet open onClose={view === "main" ? onClose : () => setView("main")} title={title} bar={bar} subHeader={view === "main" ? <Segmented label="Modo di inserimento" options={MODES} value={mode} onChange={setMode} /> : undefined}>
      {/* La parte principale resta montata (nascosta) quando si apre una sotto-schermata: il testo scritto e la proposta non si perdono. */}
      <div className={view === "main" ? "" : "hidden"}>
        {freeMeal && freeMeal.days.length > 0 && (
          <div className="mb-3">
            <GroupedList>
              <FieldRow label="Giorno" htmlFor="add-day">
                <DateInput id="add-day" value={date} min={freeMeal.days[0]} max={freeMeal.days[freeMeal.days.length - 1]} onChange={(d) => d && setDate(d)} />
              </FieldRow>
            </GroupedList>
          </div>
        )}
        <div className={mode === "ai" ? "" : "hidden"}>
          <AiEstimate store={store} date={date} free={{ freeAllowedFor, mealIsFreeFor: existingFree }} freeMealCap={settings.freeMealCap} onChanged={onChanged} onClose={onClose} fixedSlot={initialSlot} forceFree={freeMeal !== undefined} handleRef={aiHandle} onCanSaveChange={setAiCanSave}>
            {menu}
          </AiEstimate>
        </div>
        <div className={mode === "manuale" ? "flex flex-col gap-4" : "hidden"}>
          <MealForm
            values={form.values}
            onChange={form.patch}
            errors={form.errors}
            freeAllowedFor={freeAllowedFor}
            mealIsFreeFor={existingFree}
            lockedSlot={initialSlot !== undefined}
            freeMealCap={settings.freeMealCap}
            aiAvailable={form.aiAvailable}
            aiBusy={form.busy}
            aiError={form.aiError}
            aiNote={form.aiNote}
            onEstimate={form.estimate}
          />
          {menu}
        </div>
      </div>
      {view !== "main" && (
        <div className="flex flex-col gap-3">
          {view === "preferiti" && <FavoritesView store={store} date={date} initialSlot={initialSlot} dayDishes={dayDishes} onChanged={onChanged} onClose={onClose} />}
          {view === "bici" && <BikeEntry store={store} initialDay={date} today={todayKey()} kcalPerKm={settings.kcalPerKm} formId="bike-form" onDone={() => { onChanged(); onClose(); }} />}
          {view === "pesata" && <WeightForm formId="weight-form" existingKg={weightKg} onSubmit={saveWeight} />}
        </div>
      )}
    </Sheet>
  );
}

/** Scheda di modifica di un piatto: la stessa dell'aggiunta, aperta su Manuale. In fondo, separati, "Elimina" e l'azione sui preferiti. */
export function EditMealPanel({ meal, ...ctx }: PanelContext & { meal: MealRecord }) {
  const { store, days, settings, onChanged, onClose } = ctx;
  const [mode, setMode] = useState<Mode>("manuale");
  const [favoriteStatus, setFavoriteStatus] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const freeAllowedFor = (slot: MealSlot) => !hasFreeMealInWeek(days, { date: meal.date, slot });
  const initial = mealToForm(meal);
  const form = useDishForm(initial, freeAllowedFor, meal.originalText ?? null);

  useEffect(() => {
    let alive = true;
    store.listFavoriteDishes().then(
      (list) => alive && setIsFavorite(isFavoriteDish(list, meal)),
      () => {
        // L'avviso in cima lo spiega.
      },
    );
    return () => {
      alive = false;
    };
  }, [store, meal]);

  /** Salva il piatto com'è già salvato (non le modifiche non ancora salvate nella scheda) nei preferiti, o lo toglie se c'è già. */
  const toggleFavorite = async () => {
    try {
      const done = await toggleFavoriteDish(store, meal, newId);
      setIsFavorite(done === "salvato");
      setFavoriteStatus(done === "salvato" ? "Salvato nei preferiti." : "Rimosso dai preferiti.");
    } catch {
      // L'avviso in cima lo spiega; si può riprovare.
    }
  };

  const save = async () => {
    if (saving) return;
    const parsed = form.validate();
    if (!parsed) {
      setMode("manuale");
      return;
    }
    setSaving(true);
    try {
      const { isFree, ...dishFields } = parsed;
      await saveDish(store, { ...meal, isFree, ...dishFields }, isFree);
      onChanged();
      onClose();
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e la scheda resta com'è, per riprovare.
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    setSaving(true);
    try {
      await store.deleteMeal(meal.id);
      onChanged();
      onClose();
    } catch {
      // L'avviso in cima lo spiega; si può riprovare.
    } finally {
      setSaving(false);
    }
  };

  if (confirming) {
    return (
      <Sheet open onClose={() => setConfirming(false)} title="Elimina piatto" bar={{}}>
        <div className="flex flex-col gap-4 py-2" role="alertdialog" aria-label="Conferma eliminazione">
          <p className="px-1 text-[17px]">
            Eliminare <strong>{meal.name}</strong>? Non si può annullare.
          </p>
          <GroupedList>
            <ActionRow label="Elimina" tone="fuori" disabled={saving} onClick={remove} />
          </GroupedList>
          <PillButton onClick={() => setConfirming(false)}>Annulla</PillButton>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Modifica piatto"
      bar={{ onSave: () => void save(), saveDisabled: saving || form.busy || !canSaveDish(form.values, initial) }}
      subHeader={<Segmented label="Modo di inserimento" options={MODES} value={mode} onChange={setMode} />}
    >
      <div className="flex flex-col gap-4">
        <div className={mode === "manuale" ? "" : "hidden"}>
          <MealForm
            values={form.values}
            onChange={form.patch}
            errors={form.errors}
            freeAllowedFor={freeAllowedFor}
            mealIsFreeFor={(slot) => isMealFree(days.find((d) => d.date === meal.date)?.meals ?? [], slot, meal.id)}
            freeMealCap={settings.freeMealCap}
            aiAvailable={form.aiAvailable}
            aiBusy={form.busy}
            aiError={form.aiError}
            aiNote={form.aiNote}
            onEstimate={form.estimate}
          />
        </div>
        {mode === "ai" && <DishEditAi values={form.values} busy={form.busy} error={form.aiError} note={form.aiNote} onCorrect={form.correct} />}
        <div className="flex flex-col gap-1.5">
          <GroupedList>
            <ActionRow label={isFavorite ? "Rimuovi dai preferiti" : "Salva nei preferiti"} onClick={toggleFavorite} />
            <ActionRow label="Elimina piatto" tone="fuori" onClick={() => setConfirming(true)} />
          </GroupedList>
          {favoriteStatus && (
            <p role="status" className="px-4 text-[13px] font-semibold text-in-obiettivo">
              {favoriteStatus}
            </p>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/** Pannello «Uscita in bici» aperto dalla scheda Bici di Oggi: si apre sul giorno di Oggi, il giorno si può cambiare (mai oltre oggi); si modifica o si elimina. */
export function EditBikePanel(ctx: PanelContext) {
  const { store, date, settings, onChanged, onClose } = ctx;
  return (
    <Sheet open onClose={onClose} title="Uscita in bici" bar={{ formId: "bike-form" }}>
      <BikeEntry store={store} initialDay={date} today={todayKey()} kcalPerKm={settings.kcalPerKm} formId="bike-form" onDone={() => { onChanged(); onClose(); }} />
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
    <Sheet open onClose={onClose} title="Salva pasto nei preferiti">
      <form onSubmit={save} noValidate className="flex flex-col gap-3">
        <GroupedList>
          <FieldRow label="Nome del pasto" htmlFor="fav-meal-name">
            <RowInput id="fav-meal-name" value={name} onChange={setName} />
          </FieldRow>
        </GroupedList>
        <PillButton filled type="submit" disabled={busy || dishes.length === 0}>
          Salva nei preferiti
        </PillButton>
        {status && (
          <p role="status" className="px-4 text-[13px] font-semibold text-in-obiettivo">
            {status}
          </p>
        )}
      </form>
    </Sheet>
  );
}
