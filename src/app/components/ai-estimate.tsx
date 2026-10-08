"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { DateKey, MealSlot } from "@/engine";
import type { DataStore } from "@/data";
import type { MealProposal } from "@/modules/ai";
import { useAuth } from "../auth-provider";
import { requestEstimate } from "../lib/ai-client";
import { newId } from "../lib/ids";
import { SLOTS } from "../lib/meal-form";
import { DISH_NUMBER_KEYS, draftsToProposal, forceSlot, freeSwitchBlock, hasDishes, proposalToDrafts, proposalToRecords, withInitialFree, withSlot } from "../lib/proposal-form";
import type { DishDraft, DishNumberKey, DraftErrors, FreeRules, MealDraft } from "../lib/proposal-form";
import { FreeMealSwitch } from "./free-meal-switch";
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
  /** Il resto del pannello: compare solo finché non c'è una proposta da controllare. */
  children: ReactNode;
}

const NUMBER_LABELS: Record<DishNumberKey, string> = { kcal: "Kcal", protein: "Proteine (g)", carbs: "Carboidrati (g)", fat: "Grassi (g)", fiber: "Fibre (g)", salt: "Sale (g)" };
const input = "min-h-11 w-full rounded-xl bg-bg px-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent";
const blockText = (block: "settimana" | "proposta" | null): string | null =>
  block === "settimana" ? "Hai già usato il pasto libero in questa settimana: ce n'è uno solo." : block === "proposta" ? "Puoi segnare come libero un solo pasto della proposta." : null;
const primary = "min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50";
const secondary = "min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent disabled:opacity-50";

/** Campo "Cosa hai mangiato?" in cima al pannello Aggiungi, con la proposta da controllare e confermare. */
export function AiEstimate({ store, date, free, freeMealCap, onChanged, onClose, fixedSlot, children }: Props) {
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
    setDrafts(withInitialFree(proposalToDrafts(fixedSlot ? forceSlot(proposal, fixedSlot) : proposal), free, !fixedSlot));
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

  const cancel = () => {
    setDrafts(null);
    setOriginal(null);
    setError(null);
    setErrors({});
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

  const setDish = (mealKey: string, dishKey: string, patch: Partial<DishDraft>) =>
    setDrafts((ds) => ds && ds.map((m) => (m.key === mealKey ? { ...m, dishes: m.dishes.map((d) => (d.key === dishKey ? { ...d, ...patch } : d)) } : m)));
  const toggle = (key: string) => setOpenKeys((open) => (open.includes(key) ? open.filter((k) => k !== key) : [...open, key]));
  const removeDish = (mealKey: string, dishKey: string) =>
    setDrafts((ds) => ds && ds.map((m) => (m.key === mealKey ? { ...m, dishes: m.dishes.filter((d) => d.key !== dishKey) } : m)).filter((m) => m.dishes.length > 0));

  if (!drafts) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="ai-text" className="text-sm font-semibold text-muted">
            Cosa hai mangiato?
          </label>
          <textarea
            id="ai-text"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-none rounded-xl bg-bg px-3 py-2.5 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
          />
          {available === false && (
            <p role="status" className="rounded-xl bg-bg px-3 py-2.5 text-[15px] font-medium">
              Stima automatica non disponibile. Usa «Manuale».
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-bg px-3 py-2.5 text-[15px] font-medium text-bad">
              {error}
            </p>
          )}
          <button type="button" onClick={estimate} disabled={busy || text.trim() === "" || available === false} className={primary}>
            {busy ? "Sto stimando…" : "Stima"}
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {drafts.map((meal) => (
        <section key={meal.key} aria-label={`Pasto ${meal.slot}`} className="flex flex-col gap-3 rounded-2xl bg-bg p-3">
          {!fixedSlot && (
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={`slot-${meal.key}`} className="text-sm font-semibold text-muted">
              Fascia
            </label>
            <select
              id={`slot-${meal.key}`}
              value={meal.slot}
              onChange={(e) => setDrafts((ds) => ds && withSlot(ds, meal.key, e.target.value as MealDraft["slot"], free))}
              className="min-h-11 rounded-xl bg-card px-3 text-[17px] font-semibold outline-none focus:ring-2 focus:ring-accent"
            >
              {SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          )}
          {meal.dishes.map((d) => {
            const isOpen = openKeys.includes(d.key);
            const hasError = errors[d.key] !== undefined;
            return (
              <div key={d.key} className="overflow-hidden rounded-xl bg-card">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`dish-${d.key}`}
                  onClick={() => toggle(d.key)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block break-words text-[17px] font-semibold leading-snug">{d.name.trim() || "Piatto"}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                      {d.quantity.trim() !== "" && <span className="line-clamp-2 break-words">{d.quantity.trim()}</span>}
                      {d.quantityAssumed && <span className="font-semibold text-warn">ipotizzata</span>}
                      {hasError && <span className="font-semibold text-bad">da correggere</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-[17px] font-semibold tabular-nums">{d.kcal.trim() === "" ? "–" : d.kcal} <span className="text-sm font-medium text-muted">kcal</span></span>
                </button>
                {isOpen && (
                  <div id={`dish-${d.key}`} className="flex flex-col gap-3 border-t border-line p-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={`name-${d.key}`} className="text-sm font-semibold text-muted">
                        Piatto
                      </label>
                      <input id={`name-${d.key}`} type="text" autoComplete="off" value={d.name} onChange={(e) => setDish(meal.key, d.key, { name: e.target.value })} className={`${input} bg-bg`} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={`qty-${d.key}`} className="text-sm font-semibold text-muted">
                        Quantità
                      </label>
                      <textarea id={`qty-${d.key}`} autoComplete="off" rows={Math.min(8, Math.max(1, Math.ceil(d.quantity.length / 30)))} value={d.quantity} onChange={(e) => setDish(meal.key, d.key, { quantity: e.target.value.replace(/\n/g, " "), quantityAssumed: false })} className={`${input} field-sizing-content resize-none bg-bg py-2.5`} />
                      {d.note && <p className="text-sm text-muted">{d.note}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                      {DISH_NUMBER_KEYS.map((k) => {
                        const err = errors[d.key]?.[k];
                        return (
                          <div key={k} className={`flex flex-col gap-1.5 ${k === "kcal" ? "col-span-2" : ""}`}>
                            <label htmlFor={`${k}-${d.key}`} className="text-sm font-semibold text-muted">
                              {NUMBER_LABELS[k]}
                            </label>
                            <input
                              id={`${k}-${d.key}`}
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={d[k]}
                              onChange={(e) => setDish(meal.key, d.key, { [k]: e.target.value })}
                              aria-invalid={err ? true : undefined}
                              className={`${input} bg-bg ${err ? "ring-2 ring-bad" : ""}`}
                            />
                            {err && <p className="text-sm font-medium text-bad">{err}</p>}
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={() => removeDish(meal.key, d.key)} className="min-h-11 rounded-xl bg-bg px-3 text-[15px] font-semibold text-bad">
                      Togli {d.name.trim() || "il piatto"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <FreeMealSwitch
            idPrefix={`free-${meal.key}`}
            checked={meal.isFree}
            blockedText={blockText(freeSwitchBlock(drafts, meal.key, free))}
            slotName={(SLOTS.find((x) => x.value === meal.slot)?.label ?? "").toLowerCase()}
            freeMealCap={freeMealCap}
            onChange={(v) => setDrafts((ds) => ds && ds.map((m) => (m.key === meal.key ? { ...m, isFree: v } : m)))}
          />
        </section>
      ))}

      {!hasDishes(drafts) ? (
        <p className="text-[15px] font-medium">Non è rimasto nessun piatto: annulla e scrivi di nuovo.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="ai-correction" className="text-sm font-semibold text-muted">
            Correggi
          </label>
          <input id="ai-correction" type="text" autoComplete="off" value={correction} onChange={(e) => setCorrection(e.target.value)} className={input} />
          <button type="button" onClick={refine} disabled={busy || correction.trim() === ""} className={secondary}>
            {busy ? "Sto stimando…" : "Rifai la stima"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-bg px-3 py-2.5 text-[15px] font-medium text-bad">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <button type="button" onClick={confirm} disabled={busy || !hasDishes(drafts)} className={primary}>
          Conferma
        </button>
        <button type="button" onClick={cancel} disabled={busy} className={secondary}>
          Annulla
        </button>
      </div>
    </div>
  );
}
