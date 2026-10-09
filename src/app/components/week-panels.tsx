"use client";

import { useReducer, useState } from "react";
import { addDays, bikeKmTotal, weekDates, weekStart, weekSummary } from "@/engine";
import type { DateKey } from "@/engine";
import type { DataStore } from "@/data";
import type { WeekData } from "../lib/week-data";
import { formatKg, formatNumber, formatWeekdayDay, formatWeekdayLower, formatWeekRange, formatWeightDelta } from "../lib/format";
import { canGoNextWeek, panelWeekReducer } from "../lib/nav";
import type { PanelWeekAction } from "../lib/nav";
import { activityRows, defaultDayInWeek, deleteActivityValue, freeMealOfWeek, markFreeMeal, removeFreeMeal, weekMeals, weekMealTitle } from "../lib/week-actions";
import type { ActivityKind, ActivityRow, WeekMeal } from "../lib/week-actions";
import { useWeekData } from "../lib/use-week-data";
import { weekWeight } from "../lib/week-weight";
import { BikeEntry, WeightForm } from "./activity-forms";
import { AddPanel } from "./add-panel";
import { Sheet } from "./sheet";
import { SwipeRow, trashIcon, useOpenRow } from "./swipe-row";
import { MiniBars } from "./week-chart";
import { IconChevronLeft, IconChevronRight, IconNow } from "./ui/icons";
import { CircleButton, GroupedList, Num, PillButton } from "./ui/ui";

export interface PanelProps {
  store: DataStore;
  /** Il lunedì della settimana della schermata sotto: da qui parte il pannello. */
  initialMonday: DateKey;
  today: DateKey;
  /** Rilegge la schermata sotto dopo una modifica. */
  onChanged: () => void;
  onClose: () => void;
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

/**
 * La settimana mostrata dentro un pannello: parte da quella della schermata e le frecce caricano la precedente o la successiva
 * senza toccare la schermata sotto. Dopo una modifica si rileggono sia il pannello sia la schermata.
 */
function usePanelWeek(initialMonday: DateKey, today: DateKey, onChangedScreen: () => void) {
  const [monday, move] = useReducer((m: DateKey, a: PanelWeekAction) => panelWeekReducer(m, a, today), initialMonday);
  const { data, reload } = useWeekData(monday);
  const changed = () => {
    reload();
    onChangedScreen();
  };
  return {
    monday,
    data,
    dates: weekDates(monday),
    changed,
    switcher: {
      monday,
      today,
      onPrev: () => move("indietro"),
      onNext: () => move("avanti"),
      onNow: () => move("oggi"),
    },
  };
}

type Switcher = ReturnType<typeof usePanelWeek>["switcher"];

/** Le frecce delle settimane (indietro, ritorno a questa settimana, avanti) con l'intervallo al centro. Niente freccia in avanti oltre la settimana corrente. */
function WeekSwitcher({ monday, today, onPrev, onNext, onNow }: Switcher) {
  const current = weekStart(today);
  return (
    <div className="flex items-center justify-between rounded-full bg-tessera p-0.5">
      <CircleButton label="Settimana precedente" onClick={onPrev}>
        <IconChevronLeft size={16} strokeWidth={2.4} />
      </CircleButton>
      <p className="min-w-0 truncate text-center text-[15px] font-semibold" aria-live="polite">
        {formatWeekRange(monday)}
      </p>
      <span className="flex items-center">
        <CircleButton label="Torna a questa settimana" tone="comando" disabled={monday === current} onClick={onNow}>
          <IconNow size={18} />
        </CircleButton>
        <CircleButton label="Settimana successiva" disabled={!canGoNextWeek(monday, today)} onClick={onNext}>
          <IconChevronRight size={16} strokeWidth={2.4} />
        </CircleButton>
      </span>
    </div>
  );
}

const sub = "text-[13px] text-testo-secondario";

/** Riga di un giorno in un elenco dei pannelli: titolo e sotto la fonte, valore a destra; scorrendo a sinistra si elimina un valore a mano. */
function DayRow({ id, title, subtitle, value, deletable, deleteLabel, onDelete, openId, setOpen, onTap, tapLabel }: {
  id: string;
  title: string;
  subtitle?: React.ReactNode;
  value: string;
  deletable: boolean;
  deleteLabel: string;
  onDelete: () => void;
  openId: string | null;
  setOpen: (id: string, open: boolean) => void;
  onTap?: () => void;
  tapLabel?: string;
  children?: never;
}) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block text-[17px]">{title}</span>
        {subtitle && <span className={`block ${sub}`}>{subtitle}</span>}
      </span>
      <span className="shrink-0 font-cifre text-[17px] tabular-nums">{value}</span>
    </>
  );
  return (
    <li>
      <SwipeRow id={id} openId={openId} setOpen={setOpen} actions={deletable ? [{ key: "elimina", label: deleteLabel, icon: trashIcon, tone: "danger", onClick: onDelete }] : []}>
        {onTap ? (
          <button type="button" onClick={onTap} aria-label={tapLabel} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left">
            {body}
          </button>
        ) : (
          <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">{body}</div>
        )}
      </SwipeRow>
    </li>
  );
}

/** Peso: ultima pesata con la variazione, storico completo in un elenco unico (senza frecce delle settimane), «Aggiungi pesata». */
export function WeightPanel({ store, initialMonday, today, onChanged, onClose }: PanelProps) {
  const { data, changed } = usePanelWeek(initialMonday, today, onChanged);
  const { busy, run } = useAction(changed);
  const rows = useOpenRow();
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState<DateKey>(today);
  const [errors, setErrors] = useState<{ date?: string }>({});

  const all = data ? [...data.weighIns].sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
  const latest = all[0] ?? null;
  const info = data && latest ? weekWeight({ monday: weekStart(latest.date), sunday: addDays(weekStart(latest.date), 6), weighIns: data.weighIns, profileWeightKg: data.userSettings.weightKg, targetWeightKg: data.userSettings.targetWeightKg }) : null;
  const existing = all.find((w) => w.date === date);

  if (adding) {
    return (
      <Sheet open onClose={onClose} title="Pesata" back={() => setAdding(false)} bar={{ formId: "weigh-form" }}>
        <WeightForm
          key={date}
          formId="weigh-form"
          existingKg={existing?.weightKg ?? null}
          day={{ value: date, onChange: setDate, max: today, error: errors.date }}
          onSubmit={async (kg) => {
            if (date === "" || date > today) {
              setErrors({ date: "Scegli un giorno fino a oggi" });
              return;
            }
            setErrors({});
            await run(async () => {
              await store.saveWeighIn({ date, weightKg: kg });
              setAdding(false);
            });
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title="Peso">
      <div className="flex flex-col gap-4">
        <div>
          <p className={sub}>Ultima pesata</p>
          <div className="mt-1">{latest ? <Num value={formatKg(latest.weightKg)} unit="kg" size="lg" /> : <Num value="–" size="lg" tone="testo-secondario" />}</div>
          {info && info.deltaKg !== null && (
            <p className={`mt-1.5 text-[14px] font-medium ${info.tone === "ok" ? "text-in-obiettivo" : info.tone === "bad" ? "text-fuori" : "text-testo-secondario"}`}>
              {formatWeightDelta(info.deltaKg)} kg {info.comparedWith === "pesata" ? "dalla precedente" : "dal peso di partenza"}
            </p>
          )}
        </div>
        {all.length === 0 ? (
          <p className="text-[15px] text-testo-secondario">Nessuna pesata.</p>
        ) : (
          <GroupedList label="Peso">
            {all.map((w) => (
              <DayRow
                key={w.date}
                id={w.date}
                title={`${formatWeekdayDay(w.date)} ${new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: "UTC" }).format(new Date(`${w.date}T00:00:00Z`))}`}
                value={`${formatKg(w.weightKg)} kg`}
                deletable
                deleteLabel={`Elimina la pesata di ${formatWeekdayDay(w.date)}`}
                onDelete={() => void run(() => store.deleteWeighIn(w.date))}
                openId={rows.openId}
                setOpen={rows.setOpen}
              />
            ))}
          </GroupedList>
        )}
        <PillButton filled disabled={busy} onClick={() => setAdding(true)}>
          Aggiungi pesata
        </PillButton>
      </div>
    </Sheet>
  );
}

/** Testo di una parte della bici: "12,4 km · 410 kcal". */
function bikePart(km: number | null, kcal: number | null): string {
  return [km !== null ? `${formatNumber(km, 1)} km` : null, kcal !== null ? `${formatNumber(kcal)} kcal` : null].filter(Boolean).join(" · ");
}

/** Passi o bici della settimana: frecce delle settimane, numero grande nel colore della misura, grafico dei sette giorni e l'elenco dei soli giorni con un valore. */
export function ActivityWeekPanel({ kind, store, initialMonday, today, onChanged, onClose }: PanelProps & { kind: ActivityKind }) {
  const w = usePanelWeek(initialMonday, today, onChanged);
  const { busy, run } = useAction(w.changed);
  const open = useOpenRow();
  const [editing, setEditing] = useState<DateKey | null>(null);
  const data: WeekData | null = w.data;

  if (kind === "bici" && editing && data) {
    return (
      <Sheet open onClose={onClose} title="Uscita in bici" back={() => setEditing(null)} bar={{ formId: "bike-form" }}>
        <BikeEntry
          store={store}
          initialDay={editing}
          today={today}
          kcalPerKm={data.settings.kcalPerKm}
          formId="bike-form"
          onDone={() => {
            setEditing(null);
            w.changed();
          }}
        />
      </Sheet>
    );
  }

  const rows = data ? activityRows(kind, data.activity, w.dates).filter((r) => (kind === "passi" ? r.steps !== null : r.km !== null || r.kcal !== null || r.kmManual !== null || r.kcalManual !== null)) : [];
  const summary = data ? weekSummary(w.monday, data.days, data.settings, today) : null;
  const values = data ? data.days.map((d) => (kind === "passi" ? d.activity.steps : bikeKmTotal(d.activity))) : [];
  const anyManual = rows.some((r) => r.kmManual !== null || r.kcalManual !== null);

  return (
    <Sheet open onClose={onClose} title={kind === "passi" ? "Passi" : "Bici"}>
      <div className="flex flex-col gap-4">
        <WeekSwitcher {...w.switcher} />
        <div>
          <p className={sub}>{kind === "passi" ? "Media al giorno" : "Questa settimana"}</p>
          <div className="mt-1">
            {kind === "passi" ? (
              summary?.avgSteps != null ? <Num value={formatNumber(summary.avgSteps)} size="lg" tone="passi" /> : <Num value="–" size="lg" tone="testo-secondario" />
            ) : summary?.totalKm != null ? (
              <Num value={formatNumber(summary.totalKm, 1)} unit="km" size="lg" tone="bici" />
            ) : (
              <Num value="–" size="lg" tone="testo-secondario" />
            )}
          </div>
        </div>
        <MiniBars values={values} tone={kind === "passi" ? "passi" : "bici"} height={120} dates={w.dates} />
        {rows.length > 0 && (
          <GroupedList label={kind === "passi" ? "Passi per giorno" : "Uscite per giorno"}>
            {rows.map((r) =>
              kind === "bici" ? (
                <BikeDayRow key={r.date} row={r} busy={busy} open={open} onEdit={() => setEditing(r.date)} onDelete={() => void run(() => deleteActivityValue(store, r.date, "bici"))} />
              ) : (
                <DayRow
                  key={r.date}
                  id={r.date}
                  title={formatWeekdayDay(r.date)}
                  subtitle={r.source === "salute" ? "da Salute" : "a mano"}
                  value={formatNumber(r.steps ?? 0)}
                  deletable={r.canDelete}
                  deleteLabel={`Elimina il valore di ${formatWeekdayDay(r.date)}`}
                  onDelete={() => void run(() => deleteActivityValue(store, r.date, "passi"))}
                  openId={open.openId}
                  setOpen={open.setOpen}
                />
              ),
            )}
          </GroupedList>
        )}
        {kind === "passi" && <p className={sub}>I passi arrivano da Salute.</p>}
        {kind === "bici" && anyManual && <p className={sub}>Tocca un&apos;uscita a mano per modificarla.</p>}
        {kind === "bici" && (
          <PillButton filled disabled={busy || !data} onClick={() => setEditing(defaultDayInWeek(w.dates, today))}>
            Aggiungi uscita in bici
          </PillButton>
        )}
      </div>
    </Sheet>
  );
}

/** Giorno di bici: titolo, il dettaglio «4,4 km da Salute + 8 km a mano» e il totale; si tocca la riga con una parte a mano per modificarla. */
function BikeDayRow({ row, busy, open, onEdit, onDelete }: { row: ActivityRow; busy: boolean; open: { openId: string | null; setOpen: (id: string, open: boolean) => void }; onEdit: () => void; onDelete: () => void }) {
  const health = bikePart(row.km, row.kcal);
  const manual = bikePart(row.kmManual, row.kcalManual);
  const total = bikeKmTotal({ bikeKm: row.km, bikeKmManual: row.kmManual });
  const subtitle = health !== "" && manual !== "" ? `${health} da Salute + ${manual} a mano` : manual !== "" ? "a mano" : "da Salute";
  const value = total !== null ? `${formatNumber(total, 1)} km` : manual !== "" ? manual : health;
  return (
    <DayRow
      id={row.date}
      title={formatWeekdayDay(row.date)}
      subtitle={subtitle}
      value={value}
      deletable={row.canDelete && !busy}
      deleteLabel={`Elimina l'uscita a mano di ${formatWeekdayDay(row.date)}`}
      onDelete={onDelete}
      openId={open.openId}
      setOpen={open.setOpen}
      onTap={manual !== "" ? onEdit : undefined}
      tapLabel={manual !== "" ? `Modifica l'uscita a mano di ${formatWeekdayDay(row.date)}` : undefined}
    />
  );
}

function MealRow({ m, action }: { m: WeekMeal; action?: { label: string; disabled: boolean; onClick: () => void } }) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block text-[17px]">{weekMealTitle(m, formatWeekdayLower)}</span>
        <span className={`block break-words ${sub}`}>
          {m.names.join(", ")} · {formatNumber(m.kcal)} kcal
        </span>
      </span>
      {action && <span className="shrink-0 text-[16px] font-semibold text-comando">{action.label}</span>}
    </>
  );
  return (
    <li>
      {action ? (
        <button type="button" disabled={action.disabled} onClick={action.onClick} aria-label={`Segna ${weekMealTitle(m, formatWeekdayLower)} come pasto libero`} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left disabled:opacity-50">
          {body}
        </button>
      ) : (
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">{body}</div>
      )}
    </li>
  );
}

/**
 * Pasto libero della settimana: frecce delle settimane, stato, l'elenco dei pasti con «Segna» e «Aggiungi pasto libero» (apre Aggiungi con
 * l'interruttore già acceso); se la settimana ha già un pasto libero: il pasto e «Rimuovi pasto libero», senza aggiunta.
 */
export function FreeMealPanel({ store, initialMonday, today, onChanged, onClose }: PanelProps) {
  const w = usePanelWeek(initialMonday, today, onChanged);
  const { busy, run } = useAction(w.changed);
  const [adding, setAdding] = useState(false);
  const data = w.data;
  const meals = data ? weekMeals(data.meals) : [];
  const free = data ? freeMealOfWeek(data.meals) : null;

  if (adding && data) {
    // Per una settimana passata si apre sull'ultimo giorno di quella settimana; il giorno resta modificabile dentro la settimana.
    const date = defaultDayInWeek(w.dates, today);
    const weigh = data.weighIns.find((x) => x.date === date);
    return (
      <AddPanel
        store={store}
        date={date}
        days={data.days}
        settings={data.settings}
        activity={data.activity.find((a) => a.date === date) ?? null}
        weightKg={weigh?.weightKg ?? null}
        onChanged={w.changed}
        onClose={() => setAdding(false)}
        freeMeal={{ days: w.dates.filter((d) => d <= today) }}
      />
    );
  }

  return (
    <Sheet open onClose={onClose} title="Pasto libero">
      <div className="flex flex-col gap-4">
        <WeekSwitcher {...w.switcher} />
        <div>
          <p className={sub}>Questa settimana</p>
          <p className="mt-1 font-cifre text-[34px] font-medium leading-none">{free ? "Usato" : "Non usato"}</p>
        </div>
        {free ? (
          <>
            <GroupedList label="Pasto libero">
              <MealRow m={free} />
            </GroupedList>
            <p className={sub}>Il pasto resta e conta per intero.</p>
            <PillButton disabled={busy} onClick={() => void run(() => removeFreeMeal(store, free))}>
              Rimuovi pasto libero
            </PillButton>
          </>
        ) : (
          <>
            {meals.length === 0 ? (
              <p className="text-[15px] text-testo-secondario">Nessun pasto in questa settimana.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-testo-secondario">Scegli il pasto</h3>
                <GroupedList label="Pasti della settimana">
                  {meals.map((m) => (
                    <MealRow key={`${m.date}-${m.slot}`} m={m} action={{ label: "Segna", disabled: busy, onClick: () => void run(() => markFreeMeal(store, meals, m)) }} />
                  ))}
                </GroupedList>
              </div>
            )}
            <PillButton filled disabled={busy || !data} onClick={() => setAdding(true)}>
              Aggiungi pasto libero
            </PillButton>
          </>
        )}
      </div>
    </Sheet>
  );
}
