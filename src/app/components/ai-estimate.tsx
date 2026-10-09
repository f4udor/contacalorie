"use client";

import { useEffect, useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { DateKey, MealSlot } from "@/engine";
import type { DataStore } from "@/data";
import type { MealProposal } from "@/modules/ai";
import { useAuth } from "../auth-provider";
import { requestEstimate } from "../lib/ai-client";
import { newId } from "../lib/ids";
import { KCAL_CHECK_MESSAGE, SLOTS, textNeedsKcalCheck } from "../lib/meal-form";
import { DISH_NUMBER_KEYS, draftsToProposal, forceSlot, freeSwitchBlock, hasDishes, proposalToDrafts, proposalToRecords, withInitialFree, withSlot } from "../lib/proposal-form";
import type { DishDraft, DishNumberKey, DraftErrors, FreeRules, MealDraft } from "../lib/proposal-form";
import { FreeMealNote, FreeMealRow } from "./free-meal-switch";
import { ActionRow, Caption, FieldRow, GroupedList, PillButton, RowInput, RowTextarea, SelectInput, Tile } from "./ui/ui";
import { saveDish } from "../lib/save-dish";
import { useAiAvailable } from "../lib/use-ai";

interface Props {
  store: DataStore;
  date: DateKey;
  /** Regole del pasto libero (stesse dell'inserimento a mano). */
  free: FreeRules;
  /** Tetto di kcal del pasto libero, dalle impostazioni (solo per la spiegazione: il tetto lo applica il motore). */
  freeMealCap: number;
  onChanged: () => void;
  onClose: () => void;
  /** Se c'è, tutti i piatti proposti vanno in questa fascia (non si sceglie). */
  fixedSlot?: MealSlot;
  /** Aperto da «Aggiungi pasto libero»: il primo pasto proposto parte con l'interruttore acceso, se la settimana lo consente. */
  forceFree?: boolean;
  /** Il resto del pannello: compare solo finché non c'è una proposta da controllare. */
  children: ReactNode;
  /** Chi ospita la scheda ("Salva" è nell'intestazione): qui riceve il modo di confermare la proposta. */
  handleRef: RefObject<AiEstimateHandle | null>;
  /** Avvisa quando "Salva" deve accendersi (c'è una proposta con almeno un piatto) o spegnersi. */
  onCanSaveChange: (canSave: boolean) => void;
}

export interface AiEstimateHandle {
  /** Conferma la proposta: salva i piatti. Se ci sono errori nei numeri li mostra e non salva. */
  confirm: () => Promise<void>;
}

const NUMBER_LABELS: Record<DishNumberKey, string> = { kcal: "Calorie", protein: "Proteine", carbs: "Carboidrati", fat: "Grassi", fiber: "Fibre", salt: "Sale" };
const blockText = (block: "settimana" | "proposta" | null): string | null => (block === "settimana" ? "Già usato questa settimana." : block === "proposta" ? "Un solo pasto libero alla volta." : null);

/** Campo "Cosa hai mangiato?" in cima al pannello Aggiungi, con la proposta da controllare e confermare. */
export function AiEstimate({ store, date, free, freeMealCap, onChanged, onClose, fixedSlot, forceFree = false, children, handleRef, onCanSaveChange }: Props) {
  const { getAccessToken } = useAuth();
  const available = useAiAvailable();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // La proposta in modifica (bozza), la stima come l'ha data il modello e il testo da cui nasce.
  const [drafts, setDrafts] = useState<MealDraft[] | null>(null);
  const [original, setOriginal] = useState<{ proposal: MealProposal; text: string } | null>(null);
  const [correction, setCorrection] = useState("");
  const [errors, setErrors] = useState<DraftErrors>({});
  // I piatti aperti per la modifica (gli altri sono una riga sola).
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const start = (proposal: MealProposal, originalText: string) => {
    setOriginal({ proposal, text: originalText });
    const initial = withInitialFree(proposalToDrafts(fixedSlot ? forceSlot(proposal, fixedSlot) : proposal), free, !fixedSlot);
    // «Aggiungi pasto libero»: il primo pasto proposto parte libero, se nessun altro lo è già e la settimana lo consente.
    const first = initial[0];
    setDrafts(forceFree && first && !first.isFree && !initial.some((m) => m.isFree) && free.freeAllowedFor(first.slot) ? initial.map((m, i) => (i === 0 ? { ...m, isFree: true } : m)) : initial);
    setErrors({});
    setOpenKeys([]);
    setCorrection("");
  };

  const estimate = async () => {
    const t = text.trim();
    if (t === "" || busy) return;
    setBusy(true);
    setError(null);
    const r = await requestEstimate({ text: t }, getAccessToken);
    setBusy(false);
    if (r.ok) start(r.proposal, r.originalText);
    else setError(r.message);
  };

  const refine = async () => {
    const c = correction.trim();
    if (!original || !drafts || c === "" || busy) return;
    // Si parte da ciò che l'utente ha già sistemato a mano, se i numeri sono validi; altrimenti dalla stima del modello.
    const edited = draftsToProposal(drafts);
    setBusy(true);
    setError(null);
    const r = await requestEstimate({ text: original.text, previous: edited.ok && edited.proposal.meals.length > 0 ? edited.proposal : original.proposal, correction: c }, getAccessToken);
    setBusy(false);
    if (r.ok) start(r.proposal, original.text);
    else setError(r.message);
  };

  const confirm = async () => {
    if (!drafts || !original) return;
    const r = draftsToProposal(drafts);
    if (!r.ok) {
      setErrors(r.errors);
      // I piatti con un errore si aprono da soli.
      setOpenKeys((open) => [...new Set([...open, ...Object.keys(r.errors)])]);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      // Il segno "libero" vale per l'intero pasto (stessa fascia); il tetto di kcal lo applica solo il motore.
      const isFree = new Map(r.proposal.meals.map((m) => [m.slot, m.freeMeal === true]));
      for (const record of proposalToRecords(r.proposal, date, original.text, newId)) await saveDish(store, record, isFree.get(record.slot) ?? false);
      onChanged();
      onClose();
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega; la proposta resta com'è per riprovare.
    } finally {
      setBusy(false);
    }
  };

  const canSave = drafts !== null && hasDishes(drafts) && !busy;
  useEffect(() => {
    handleRef.current = { confirm };
  });
  useEffect(() => {
    onCanSaveChange(canSave);
  }, [canSave, onCanSaveChange]);
  useEffect(() => () => onCanSaveChange(false), [onCanSaveChange]);

  const setDish = (mealKey: string, dishKey: string, patch: Partial<DishDraft>) =>
    setDrafts((ds) => ds && ds.map((m) => (m.key === mealKey ? { ...m, dishes: m.dishes.map((d) => (d.key === dishKey ? { ...d, ...patch } : d)) } : m)));
  const toggle = (key: string) => setOpenKeys((open) => (open.includes(key) ? open.filter((k) => k !== key) : [...open, key]));
  const removeDish = (mealKey: string, dishKey: string) =>
    setDrafts((ds) => ds && ds.map((m) => (m.key === mealKey ? { ...m, dishes: m.dishes.filter((d) => d.key !== dishKey) } : m)).filter((m) => m.dishes.length > 0));

  if (!drafts) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-elenco bg-tessera px-4 py-3">
          <label htmlFor="ai-text" className="sr-only">
            Cosa hai mangiato?
          </label>
          <textarea
            id="ai-text"
            rows={4}
            value={text}
            placeholder="Cosa hai mangiato?"
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-none bg-transparent text-[17px] outline-none placeholder:text-testo-secondario"
          />
        </div>
        {available === false && (
          <p role="status" className="px-4 text-[14px] text-testo-secondario">
            Stima non disponibile. Passa a Manuale.
          </p>
        )}
        {error && <Caption tone="fuori">{error}</Caption>}
        <PillButton filled onClick={estimate} disabled={busy || text.trim() === "" || available === false}>
          {busy ? "Stima in corso…" : "Stima"}
        </PillButton>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {drafts.map((meal) => (
        <section key={meal.key} aria-label={`Pasto ${meal.slot}`} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <GroupedList>
              {!fixedSlot && (
                <FieldRow label="Pasto" htmlFor={`slot-${meal.key}`}>
                  <SelectInput id={`slot-${meal.key}`} value={meal.slot} options={SLOTS} onChange={(slot) => setDrafts((ds) => ds && withSlot(ds, meal.key, slot, free))} />
                </FieldRow>
              )}
              <FreeMealRow idPrefix={`free-${meal.key}`} checked={meal.isFree} blockedText={blockText(freeSwitchBlock(drafts, meal.key, free))} onChange={(v) => setDrafts((ds) => ds && ds.map((m) => (m.key === meal.key ? { ...m, isFree: v } : m)))} />
            </GroupedList>
            <FreeMealNote idPrefix={`free-${meal.key}`} blockedText={blockText(freeSwitchBlock(drafts, meal.key, free))} freeMealCap={freeMealCap} />
          </div>
          {meal.dishes.map((d) => {
            const isOpen = openKeys.includes(d.key);
            const hasError = errors[d.key] !== undefined;
            // Il controllo vale per i numeri stimati dal modello e si ricalcola a ogni ritocco.
            const check = textNeedsKcalCheck(d);
            return (
              <Tile key={d.key} className="overflow-hidden">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`dish-${d.key}`}
                  onClick={() => toggle(d.key)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block break-words text-[16px] leading-snug">{d.name.trim() || "Piatto"}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-testo-secondario">
                      {d.quantity.trim() !== "" && <span className="line-clamp-2 break-words">{d.quantity.trim()}</span>}
                      {d.quantityAssumed && <span className="font-semibold text-attenzione">ipotizzata</span>}
                      {hasError && <span className="font-semibold text-fuori">da correggere</span>}
                      {check && (
                        <span className="font-semibold text-attenzione">
                          <span aria-hidden="true">⚠ </span>da controllare
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 font-cifre text-[17px] tabular-nums">{d.kcal.trim() === "" ? "–" : d.kcal}</span>
                </button>
                {isOpen && (
                  <div id={`dish-${d.key}`} className="border-t border-separatore">
                    <ul className="divide-y divide-separatore">
                      <FieldRow label="Nome" htmlFor={`name-${d.key}`}>
                        <RowInput id={`name-${d.key}`} value={d.name} onChange={(v) => setDish(meal.key, d.key, { name: v })} />
                      </FieldRow>
                      <FieldRow label="Quantità" htmlFor={`qty-${d.key}`}>
                        <RowTextarea id={`qty-${d.key}`} value={d.quantity} onChange={(v) => setDish(meal.key, d.key, { quantity: v, quantityAssumed: false })} />
                      </FieldRow>
                      {DISH_NUMBER_KEYS.map((k) => {
                        const err = errors[d.key]?.[k];
                        return (
                          <FieldRow key={k} label={NUMBER_LABELS[k]} htmlFor={`${k}-${d.key}`} unit={k === "kcal" ? "kcal" : "g"} error={err}>
                            <RowInput id={`${k}-${d.key}`} value={d[k]} onChange={(v) => setDish(meal.key, d.key, { [k]: v })} inputMode="decimal" invalid={Boolean(err)} />
                          </FieldRow>
                        );
                      })}
                    </ul>
                    {d.note && <p className="px-4 pt-2 text-[13px] text-testo-secondario">{d.note}</p>}
                    {check && (
                      <p role="status" className="px-4 pt-2 text-[13px] font-semibold text-attenzione">
                        <span aria-hidden="true">⚠ </span>
                        {KCAL_CHECK_MESSAGE}
                      </p>
                    )}
                    <ul className="mt-1">
                      <ActionRow label="Elimina piatto" tone="fuori" onClick={() => removeDish(meal.key, d.key)} />
                    </ul>
                  </div>
                )}
              </Tile>
            );
          })}
        </section>
      ))}

      {!hasDishes(drafts) ? (
        <p className="px-1 text-[15px] font-medium">Non è rimasto nessun piatto: chiudi e scrivi di nuovo.</p>
      ) : (
        <>
          <Caption>Tocca un piatto per correggere i numeri.</Caption>
          <div className="rounded-elenco bg-tessera px-4 py-3">
            <label htmlFor="ai-correction" className="sr-only">
              Correggi a parole
            </label>
            <textarea id="ai-correction" rows={3} value={correction} placeholder="Correggi a parole" onChange={(e) => setCorrection(e.target.value)} className="w-full resize-none bg-transparent text-[17px] outline-none placeholder:text-testo-secondario" />
          </div>
          <PillButton onClick={refine} disabled={busy || correction.trim() === ""}>
            {busy ? "Stima in corso…" : "Rifai la stima"}
          </PillButton>
        </>
      )}
      {error && <Caption tone="fuori">{error}</Caption>}
    </div>
  );
}
