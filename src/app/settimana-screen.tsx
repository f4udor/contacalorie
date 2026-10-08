"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addDays, weekStart } from "@/engine";
import type { DateKey } from "@/engine";
import { Card } from "./components/card";
import { WeekChart } from "./components/week-chart";
import { formatDayMonth, formatNumber, formatSigned } from "./lib/format";
import { useToday } from "./lib/use-today";
import { useWeekData } from "./lib/use-week-data";
import { buildWeekView } from "./lib/week-view";

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

const arrow = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

function Stat({ label, value, hint, wide }: { label: string; value: string; hint?: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl bg-card p-3.5 ${wide ? "col-span-2" : ""}`}>
      <h3 className="text-sm font-semibold text-muted">{label}</h3>
      <p className="mt-1 text-[22px] font-bold leading-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const dash = "–";

/** Schermata Settimana (lunedì-domenica). */
export function SettimanaScreen() {
  const today = useToday();
  const param = useSearchParams().get("w");
  const anchor = param && DATE_PARAM.test(param) ? param : today;
  const monday: DateKey | null = anchor ? weekStart(anchor) : null;
  const { data } = useWeekData(monday);

  if (!today || !monday) return <main aria-busy="true" />;

  const sunday = addDays(monday, 6);
  const isCurrent = monday === weekStart(today);
  const href = (d: DateKey) => (d === weekStart(today) ? "/settimana" : `/settimana?w=${d}`);
  const btn = "flex min-h-11 min-w-11 items-center justify-center rounded-full bg-card text-accent";
  const view = data ? buildWeekView({ date: monday, days: data.days, settings: data.settings }) : null;
  const s = view?.summary;

  return (
    <main>
      <header className="pb-3 pt-4">
        <div className="flex min-h-11 items-center justify-end gap-2">
          {!isCurrent && (
            <Link href="/settimana" className="flex min-h-11 items-center whitespace-nowrap rounded-full bg-card px-4 text-[15px] font-semibold text-accent">
              Questa settimana
            </Link>
          )}
          <Link href={href(addDays(monday, -7))} aria-label="Settimana precedente" className={btn}>
            {arrow("M15 5l-7 7 7 7")}
          </Link>
          <Link href={href(addDays(monday, 7))} aria-label="Settimana successiva" className={btn}>
            {arrow("M9 5l7 7-7 7")}
          </Link>
        </div>
        <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-tight">Settimana</h1>
        <p className="text-[17px] font-medium text-muted">
          {formatDayMonth(monday)} – {formatDayMonth(sunday)}
        </p>
      </header>

      {view && s && (
        <div className="flex flex-col gap-3">
          <Card className="pb-2">
            <WeekChart bars={view.bars} today={today} />
            <p className="pt-1 text-center text-xs text-muted">La linea indica l&apos;obiettivo del giorno. Tocca una barra per aprire il giorno.</p>
          </Card>

          {view.isEmpty && (
            <Card>
              <p className="text-center text-[15px] text-muted">Nessun dato in questa settimana.</p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Saldo"
              value={s.balance === null ? dash : `${formatSigned(s.balance)} kcal`}
              hint={s.balance === null ? undefined : s.balance < 0 ? "da recuperare" : "di vantaggio"}
            />
            <Stat label="Media kcal" value={s.avgKcal === null ? dash : `${formatNumber(s.avgKcal)} kcal`} hint="sui giorni con pasti" />
            <Stat label="Bici" value={s.totalKm === null ? dash : `${formatNumber(s.totalKm, 1)} km`} />
            <Stat label="Passi medi" value={s.avgSteps === null ? dash : formatNumber(s.avgSteps)} hint="sui giorni con passi" />
            <Stat label="Pasto libero" value={s.freeMealUsed ? "usato" : "non usato"} wide />
          </div>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Medie dei nutrienti</h2>
            <dl className="mt-2 divide-y divide-line">
              {(
                [
                  ["Proteine", "protein", 0],
                  ["Carboidrati", "carbs", 0],
                  ["Grassi", "fat", 0],
                  ["Fibre", "fiber", 0],
                  ["Sale", "salt", 1],
                ] as const
              ).map(([name, key, decimals]) => (
                <div key={key} className="flex min-h-11 items-center justify-between">
                  <dt className="text-[17px]">{name}</dt>
                  <dd className="text-[17px] font-semibold tabular-nums">{s.avgNutrients === null ? dash : `${formatNumber(s.avgNutrients[key], decimals)} g`}</dd>
                </div>
              ))}
            </dl>
            <p className="pt-1 text-xs text-muted">Al giorno, sui giorni con pasti.</p>
          </Card>
        </div>
      )}
    </main>
  );
}
