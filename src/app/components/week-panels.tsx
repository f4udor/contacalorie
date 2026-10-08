"use client";

import { useState } from "react";
import type { DateKey, MealSlot } from "@/engine";
import type { DataStore } from "@/data";
import type { WeekData } from "../lib/week-data";
import { formatDateLong, formatNumber } from "../lib/format";
import { hasManualBike, validateWeight } from "../lib/activity-form";
import { activityRows, defaultWeighInDate, deleteActivityValue, freeMealOfWeek, markFreeMeal, removeFreeMeal, saveManualBike, weekMeals, weighInsInWeek } from "../lib/week-actions";
import type { ActivityKind, ActivityRow, WeekMeal } from "../lib/week-actions";
import { BikeForm } from "./activity-forms";
import { TextField } from "./field";
import { Sheet } from "./sheet";
import { SwipeRow, trashIcon, useOpenRow } from "./swipe-row";

const SLOT_LABEL: Record<MealSlot, string> = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", spuntino: "Spuntino" };

export interface PanelProps {
  store: DataStore;
  data: WeekData;
  dates: DateKey[];
  today: DateKey;
  onChanged: () => void;
  onClose: () => void;
}

const primary = "min-h-12 w-full rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50";
const secondary = "min-h-12 w-full rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent disabled:opacity-50";

function TrashButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-bad disabled:opacity-50">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" />
      </svg>
    </button>
  );
}

/** Esegue un'azione di modifica: se non riesce l'avviso in cima lo spiega e il pannello resta com'è. */
function useAction(onChanged: () => void) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega.
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/** Pesate della settimana: si eliminano e si aggiungono. */
export function WeightPanel({ store, data, dates, today, onChanged, onClose }: PanelProps) {
  const { busy, run } = useAction(onChanged);
  const list = weighInsInWeek(data.weighIns, dates[0], dates[6]);
  const rows = useOpenRow();
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState<DateKey>(() => defaultWeighInDate(dates, today));
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const existing = data.weighIns.find((w) => w.date === date);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateWeight(value);
    if (!r.ok) return setError(r.error);
    setError(undefined);
    void run(async () => {
      await store.saveWeighIn({ date, weightKg: r.weightKg });
      setAdding(false);
      setValue("");
    });
  };

  return (
    <Sheet open onClose={onClose} title="Pesate">
      {list.length === 0 ? (
        <p className="py-2 text-[15px] text-muted">Nessuna pesata in questa settimana.</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((w) => (
            <li key={w.date}>
              <SwipeRow id={w.date} openId={rows.openId} setOpen={rows.setOpen} actions={[{ key: "elimina", label: `Elimina la pesata di ${formatDateLong(w.date)}`, icon: trashIcon, tone: "danger", onClick: () => void run(() => store.deleteWeighIn(w.date)) }]}>
                <div className="flex min-h-14 items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold tabular-nums">{formatNumber(w.weightKg, 1)} kg</span>
                    <span className="block text-sm text-muted">{formatDateLong(w.date)}</span>
                  </span>
                  <TrashButton label={`Elimina la pesata di ${formatDateLong(w.date)}`} disabled={busy} onClick={() => void run(() => store.deleteWeighIn(w.date))} />
                </div>
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <form onSubmit={save} noValidate className="mt-3 flex flex-col gap-4 border-t border-line pt-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="weigh-date" className="text-sm font-semibold text-muted">
              Giorno
            </label>
            <select id="weigh-date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 w-full rounded-xl bg-bg px-3 text-[17px]">
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDateLong(d)}
                </option>
              ))}
            </select>
          </div>
          <TextField id="weigh-kg" label="Peso (kg)" value={value} onChange={setValue} error={error} hint={existing ? "Hai già una pesata per questo giorno: salvando la sostituisci." : "Una pesata per giorno."} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={primary}>
              Salva pesata
            </button>
            <button type="button" onClick={() => setAdding(false)} className={secondary}>
              Annulla
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={`${secondary} mt-3`}>
          Aggiungi pesata
        </button>
      )}
    </Sheet>
  );
}

/** Testo di una parte della bici: "12,4 km · 410 kcal". */
function bikePart(km: number | null, kcal: number | null): string {
  return [km !== null ? `${formatNumber(km, 1)} km` : null, kcal !== null ? `${formatNumber(kcal)} kcal` : null].filter(Boolean).join(" · ");
}

/** Giorno di bici nel pannello della Settimana: parte di Salute (sola lettura) e parte a mano (si aggiunge, si modifica, si elimina). */
function BikeDayRow({ row, busy, openId, setOpen, onEdit, onDelete }: { row: ActivityRow; busy: boolean; openId: string | null; setOpen: (id: string, open: boolean) => void; onEdit: () => void; onDelete: () => void }) {
  const health = bikePart(row.km, row.kcal);
  const manual = bikePart(row.kmManual, row.kcalManual);
  const label = `Elimina la bici a mano di ${formatDateLong(row.date)}`;
  return (
    <SwipeRow id={row.date} openId={openId} setOpen={setOpen} actions={row.canDelete ? [{ key: "elimina", label, icon: trashIcon, tone: "danger", onClick: onDelete }] : []}>
      <div className="flex min-h-14 items-center justify-between gap-3">
        <span className="min-w-0 text-[17px]">{formatDateLong(row.date)}</span>
        <span className="flex min-w-0 flex-col items-end">
          {health === "" && manual === "" && <span className="text-[17px] text-muted">–</span>}
          {health !== "" && (
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-muted">da Salute</span>
              <span className="text-[17px] font-semibold tabular-nums">{health}</span>
            </span>
          )}
          {manual !== "" && (
            <span className="flex items-center">
              <button type="button" onClick={onEdit} aria-label={`Modifica la bici a mano di ${formatDateLong(row.date)}`} className="flex min-h-11 items-center gap-2 text-[17px] font-semibold tabular-nums text-accent">
                <span className="rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-muted">a mano</span>
                {manual}
              </button>
              <TrashButton label={label} disabled={busy} onClick={onDelete} />
            </span>
          )}
          {manual === "" && (
            <button type="button" onClick={onEdit} aria-label={`Aggiungi la bici a mano di ${formatDateLong(row.date)}`} className="min-h-11 text-[15px] font-semibold text-accent">
              + A mano
            </button>
          )}
        </span>
      </div>
    </SwipeRow>
  );
}

/** I sette giorni della settimana con passi (sola lettura, salvo i vecchi valori a mano da eliminare) o bici (parte a mano modificabile). */
export function ActivityWeekPanel({ kind, store, data, dates, onChanged, onClose }: PanelProps & { kind: ActivityKind }) {
  const { busy, run } = useAction(onChanged);
  const rows = activityRows(kind, data.activity, dates);
  const open = useOpenRow();
  const [editing, setEditing] = useState<DateKey | null>(null);

  if (kind === "bici" && editing) {
    const existing = data.activity.find((a) => a.date === editing) ?? null;
    const done = () => {
      setEditing(null);
      onChanged();
    };
    return (
      <Sheet open onClose={onClose} title="Bici a mano">
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => setEditing(null)} className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[17px] font-semibold text-accent">
            ‹ Indietro
          </button>
          <p className="text-[15px] font-semibold">{formatDateLong(editing)}</p>
          <BikeForm
            existing={existing}
            kcalPerKm={data.settings.kcalPerKm}
            onSubmit={async (bike) => {
              await saveManualBike(store, editing, bike);
              done();
            }}
            onDelete={hasManualBike(existing) ? async () => { await deleteActivityValue(store, editing, "bici"); done(); } : undefined}
          />
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title={kind === "passi" ? "Passi" : "Bici"}>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.date}>
            {kind === "bici" ? (
              <BikeDayRow row={r} busy={busy} openId={open.openId} setOpen={open.setOpen} onEdit={() => setEditing(r.date)} onDelete={() => void run(() => deleteActivityValue(store, r.date, "bici"))} />
            ) : (
              <SwipeRow
                id={r.date}
                openId={open.openId}
                setOpen={open.setOpen}
                actions={r.canDelete ? [{ key: "elimina", label: `Elimina il valore di ${formatDateLong(r.date)}`, icon: trashIcon, tone: "danger", onClick: () => void run(() => deleteActivityValue(store, r.date, "passi")) }] : []}
              >
                <div className="flex min-h-14 items-center justify-between gap-3">
                  <span className="min-w-0 text-[17px]">{formatDateLong(r.date)}</span>
                  <span className="flex items-center gap-2">
                    {r.steps === null ? (
                      <span className="text-[17px] text-muted">–</span>
                    ) : (
                      <>
                        {r.source && <span className="rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-muted">{r.source === "salute" ? "da Salute" : "manuale"}</span>}
                        <span className="text-[17px] font-semibold tabular-nums">{formatNumber(r.steps)}</span>
                      </>
                    )}
                    {r.canDelete && <TrashButton label={`Elimina il valore di ${formatDateLong(r.date)}`} disabled={busy} onClick={() => void run(() => deleteActivityValue(store, r.date, "passi"))} />}
                  </span>
                </div>
              </SwipeRow>
            )}
          </li>
        ))}
      </ul>
      <p className="pt-3 text-sm text-muted">
        {kind === "passi"
          ? "I passi arrivano da Salute e non si modificano. Un vecchio valore inserito a mano si può solo eliminare."
          : "I km da Salute non si modificano. A mano puoi aggiungere un valore per giorno, che si somma: lo modifichi toccandolo, lo elimini col cestino."}
      </p>
    </Sheet>
  );
}

function MealLine({ m }: { m: WeekMeal }) {
  return (
    <span className="min-w-0">
      <span className="block text-[17px] font-semibold">
        {formatDateLong(m.date)} · {SLOT_LABEL[m.slot]}
      </span>
      <span className="block break-words text-sm text-muted">
        {formatNumber(m.kcal)} kcal · {m.names.join(", ")}
      </span>
    </span>
  );
}

/** Pasto libero della settimana: si toglie (il pasto resta e conta per intero) oppure si sceglie tra i pasti della settimana. */
export function FreeMealPanel({ store, data, onChanged, onClose }: PanelProps) {
  const { busy, run } = useAction(onChanged);
  const meals = weekMeals(data.meals);
  const free = freeMealOfWeek(data.meals);
  return (
    <Sheet open onClose={onClose} title="Pasto libero">
      {free ? (
        <div>
          <div className="py-2">
            <MealLine m={free} />
          </div>
          <p className="pb-3 text-sm text-muted">Se lo togli il pasto resta, ma conta per intero nel budget.</p>
          <button type="button" disabled={busy} onClick={() => void run(() => removeFreeMeal(store, free))} className={secondary}>
            Togli pasto libero
          </button>
        </div>
      ) : meals.length === 0 ? (
        <p className="py-2 text-[15px] text-muted">Nessun pasto in questa settimana.</p>
      ) : (
        <div>
          <p className="pb-2 text-sm text-muted">Scegli il pasto della settimana da segnare come libero: nel budget conta al massimo il tetto delle Impostazioni.</p>
          <ul className="divide-y divide-line">
            {meals.map((m) => (
              <li key={`${m.date}-${m.slot}`} className="flex min-h-14 items-center justify-between gap-3 py-1">
                <MealLine m={m} />
                <button type="button" disabled={busy} onClick={() => void run(() => markFreeMeal(store, meals, m))} className="min-h-11 shrink-0 rounded-xl bg-bg px-3 text-[15px] font-semibold text-accent disabled:opacity-50">
                  Segna come libero
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
