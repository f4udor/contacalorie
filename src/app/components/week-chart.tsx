import Link from "next/link";
import type { RingColor } from "@/engine";
import { formatDateLong, formatNumber, formatWeekday } from "../lib/format";
import type { WeekBar } from "../lib/week-view";

const FILL: Record<RingColor, string> = {
  accento: "var(--accent)",
  giallo: "var(--warn-fill)",
  rosso: "var(--bad-fill)",
  neutro: "var(--track)",
};

const CHART_HEIGHT = 168;

/** Sette barre delle kcal mangiate con la linea dell'obiettivo di ogni giorno. Toccare una barra apre quel giorno. */
export function WeekChart({ bars, today }: { bars: WeekBar[]; today: string }) {
  return (
    <ul className="flex" aria-label="Kcal mangiate per giorno">
      {bars.map((b) => {
        const label = `${formatDateLong(b.date)}: ${b.hasMeals ? `${formatNumber(b.eaten)} kcal mangiate` : "nessun pasto"}, obiettivo ${formatNumber(b.target)} kcal`;
        const isToday = b.date === today;
        return (
          <li key={b.date} className="flex-1">
            <Link href={isToday ? "/" : `/?d=${b.date}`} aria-label={label} className="flex min-h-11 flex-col items-center gap-1 px-0.5">
              <span className="relative block w-full" style={{ height: CHART_HEIGHT }}>
                {b.hasMeals && (
                  <span
                    className="absolute inset-x-1.5 bottom-0 block rounded-t-lg"
                    style={{ height: `${Math.max(b.barRatio * 100, 2)}%`, background: FILL[b.color] }}
                  />
                )}
                <span className="absolute inset-x-0 block h-0.5 rounded-full bg-fg" style={{ bottom: `calc(${b.targetRatio * 100}% - 1px)` }} />
              </span>
              <span className={`text-[13px] font-semibold ${isToday ? "text-accent" : "text-muted"}`}>{formatWeekday(b.date).charAt(0)}</span>
              <span className="text-[11px] tabular-nums text-muted">{b.hasMeals ? formatNumber(b.eaten) : "–"}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
