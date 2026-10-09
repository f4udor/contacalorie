"use client";

import { useEffect, useRef, useState } from "react";
import { hasFreeMealInWeek } from "@/engine";
import type { DateKey, Day, MealSlot, Settings } from "@/engine";
import type { ActivityRecord, DataStore, MealRecord } from "@/data";
import { defaultMealName, favoriteForMeal, isFavoriteDish, toggleFavoriteDish } from "../lib/favorites";
import { newId } from "../lib/ids";
import { isMealFree, saveDish } from "../lib/save-dish";
import { hasManualBike } from "../lib/activity-form";
import type { ParsedBike } from "../lib/activity-form";
import { deleteActivityValue, saveManualBike } from "../lib/week-actions";
import { canSaveDish } from "../lib/dish-sheet";
import { emptyMealForm, mealToForm } from "../lib/meal-form";
import { useDishForm } from "../lib/use-dish-form";
import type { ParsedMeal } from "../lib/meal-form";
import { BikeForm, WeightForm } from "./activity-forms";
import { AiEstimate } from "./ai-estimate";
import type { AiEstimateHandle } from "./ai-estimate";
import { DishEditAi } from "./dish-edit-ai";
import { FavoritesView } from "./favorites-view";
import { MealForm } from "./meal-form";
import { DateField } from "./settings-fields";
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

function MenuRow({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left">
      <span className="text-[17px] font-semibold">{title}</span>
      {chevron}
    </button>
  );
}

const SLOT_NAME: Record<MealSlot, string> = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", spuntino: "Spuntino" };
const SUB_TITLES = { bici: "Bici a mano", pesata: "Pesata", preferiti: "Preferiti" } as const;

type Mode = "ai" | "manuale";

/** Selettore "AI | Manuale" accanto al titolo del pannello. */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const options: { value: Mode; label: string }[] = [
    { value: "ai", label: "AI" },
    { value: "manuale", label: "Manuale" },
  ];
  return (
    <div role="radiogroup" aria-label="Modo di inserimento" className="grid grid-cols-2 gap-0.5 rounded-xl bg-bg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={mode === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 rounded-[10px] px-3 text-[15px] font-semibold ${mode === o.value ? "bg-accent text-white" : "text-fg"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Pannello "Aggiungi", dal pulsante +. Si apre su "AI"; "Manuale" è il piatto a mano. Con `initialSlot` (da "+ Aggiungi piatto"
 * di un pasto) il titolo è la fascia, che è fissata, e sotto resta solo "Preferiti".
 */
export function AddPanel(ctx: PanelContext & { initialSlot?: MealSlot; /** Aperto da «Aggiungi pasto libero»: l'interruttore parte acceso e il giorno si può cambiare tra quelli indicati. */ freeMeal?: { days: readonly DateKey[] } }) {
  const { store, date: initialDate, days, settings, activity, weightKg, onChanged, onClose, initialSlot, freeMeal } = ctx;
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

  const saveBike = async (bike: ParsedBike) => {
    await saveManualBike(store, date, bike);
    onChanged();
    onClose();
  };
  const removeBike = async () => {
    await deleteActivityValue(store, date, "bici");
    onChanged();
    onClose();
  };

  const saveWeight = async (kg: number) => {
    await store.saveWeighIn({ date, weightKg: kg });
    onChanged();
    onClose();
  };

  const title = view === "main" ? (initialSlot ? SLOT_NAME[initialSlot] : "Aggiungi") : SUB_TITLES[view];
  const menu = (
    <div className="overflow-hidden rounded-2xl bg-bg">
      <MenuRow title="Preferiti" onClick={() => setView("preferiti")} />
      {!initialSlot && (
        <>
          <div className="border-t border-line" />
          <MenuRow title="Bici a mano" onClick={() => setView("bici")} />
          <div className="border-t border-line" />
          <MenuRow title="Pesata" onClick={() => setView("pesata")} />
        </>
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
    <Sheet open onClose={onClose} title={title} bar={bar} subHeader={view === "main" ? <ModeSwitch mode={mode} onChange={setMode} /> : undefined}>
      {/* La parte principale resta montata (nascosta) quando si apre una sotto-schermata: il testo scritto e la proposta non si perdono. */}
      <div className={view === "main" ? "" : "hidden"}>
        {freeMeal && freeMeal.days.length > 0 && (
          <div className="mb-3">
            <DateField id="add-day" label="Giorno" value={date} min={freeMeal.days[0]} max={freeMeal.days[freeMeal.days.length - 1]} onChange={(d) => d && setDate(d)} />
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
          <button type="button" onClick={() => setView("main")} className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[17px] font-semibold text-accent">
            ‹ Indietro
          </button>
          {view === "preferiti" && <FavoritesView store={store} date={date} initialSlot={initialSlot} dayDishes={dayDishes} onChanged={onChanged} onClose={onClose} />}
          {view === "bici" && <BikeForm formId="bike-form" existing={activity} kcalPerKm={settings.kcalPerKm} onSubmit={saveBike} onDelete={hasManualBike(activity) ? removeBike : undefined} />}
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
      <Sheet open onClose={onClose} title="Elimina piatto" bar={{}}>
        <div className="flex flex-col gap-4 py-2" role="alertdialog" aria-label="Conferma eliminazione">
          <p className="text-[17px]">
            Eliminare <strong>{meal.name}</strong>? Non si può annullare.
          </p>
          <button type="button" disabled={saving} onClick={remove} className="min-h-12 rounded-xl bg-bad-fill px-4 text-[17px] font-semibold text-white disabled:opacity-50">
            Elimina
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
            Annulla
          </button>
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
      subHeader={<ModeSwitch mode={mode} onChange={setMode} />}
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
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          <button type="button" onClick={toggleFavorite} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
            {isFavorite ? "Rimuovi dai preferiti" : "Salva nei preferiti"}
          </button>
          {favoriteStatus && (
            <p role="status" className="text-center text-[15px] font-semibold text-ok">
              {favoriteStatus}
            </p>
          )}
          <button type="button" onClick={() => setConfirming(true)} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-bad">
            Elimina piatto
          </button>
        </div>
      </div>
    </Sheet>
  );
}

/** Pannello della parte a mano della bici del giorno, aperto dalla scheda Attività: si modifica o si elimina. */
export function EditBikePanel(ctx: PanelContext) {
  const { store, date, settings, activity, onChanged, onClose } = ctx;
  const save = async (bike: ParsedBike) => {
    await saveManualBike(store, date, bike);
    onChanged();
    onClose();
  };
  const remove = async () => {
    await deleteActivityValue(store, date, "bici");
    onChanged();
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="Bici a mano" bar={{ formId: "bike-form" }}>
      <BikeForm formId="bike-form" existing={activity} kcalPerKm={settings.kcalPerKm} onSubmit={save} onDelete={hasManualBike(activity) ? remove : undefined} />
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
