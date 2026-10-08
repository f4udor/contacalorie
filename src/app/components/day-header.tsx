import Link from "next/link";
import { addDays } from "@/engine";
import type { DateKey } from "@/engine";
import { formatDateLong, formatDayMonth, formatWeekday } from "../lib/format";

function hrefFor(date: DateKey, today: DateKey): string {
  return date === today ? "/" : `/?d=${date}`;
}

const arrow = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Titolo del giorno con frecce per cambiare giorno e tasto "Oggi". */
export function DayHeader({ date, today }: { date: DateKey; today: DateKey }) {
  const isToday = date === today;
  const btn = "flex min-h-11 min-w-11 items-center justify-center rounded-full bg-card text-accent";
  return (
    <header className="pb-3 pt-4">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">{isToday ? formatDateLong(date) : formatDayMonth(date)}</p>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Link href="/" className="flex min-h-11 items-center rounded-full bg-card px-4 text-[15px] font-semibold text-accent">
              Oggi
            </Link>
          )}
          <Link href={hrefFor(addDays(date, -1), today)} aria-label="Giorno precedente" className={btn}>
            {arrow("M15 5l-7 7 7 7")}
          </Link>
          <Link href={hrefFor(addDays(date, 1), today)} aria-label="Giorno successivo" className={btn}>
            {arrow("M9 5l7 7-7 7")}
          </Link>
        </div>
      </div>
      <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-tight">{isToday ? "Oggi" : formatWeekday(date)}</h1>
    </header>
  );
}
