import Link from "next/link";
import type { RingColor } from "@/engine";
import { formatDateLong, formatNumber, formatWeekday } from "../lib/format";
import type { WeekBar } from "../lib/week-view";

const FILL: Record<RingColor, string> = {
  accento: "var(--comando)",
  verde: "var(--in-obiettivo)",
  giallo: "var(--attenzione)",
  rosso: "var(--fuori)",
  neutro: "var(--tessera)",
};

const CHART_HEIGHT = 168;

/** Sette barre delle kcal mangiate con la linea dell'obiettivo di ogni giorno. Toccare una barra apre quel giorno. */
export function WeekChart({ bars, today, avg }: { bars: WeekBar[]; today: string; avg: { kcal: number; ratio: number } | null }) {
  return (
    <div>
    {/* Legenda: dice quale linea è l'obiettivo e quale la media; sta sopra le barre, quindi non le copre mai. */}
    <p className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 px-2 pb-1 text-xs font-semibold text-muted" aria-label="Legenda del grafico">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="block h-0.5 w-5 rounded-full bg-fg" />
        obiettivo
      </span>
      {avg && (
        <span data-avg-label className="flex items-center gap-1.5 tabular-nums">
          <span aria-hidden="true" className="block w-5 border-t-2 border-dashed border-avg-line" />
          media {formatNumber(avg.kcal)}
        </span>
      )}
    </p>
    <ul className="flex" aria-label="Kcal mangiate per giorno">
      {bars.map((b) => {
        const label = `${formatDateLong(b.date)}: ${b.hasMeals ? `${formatNumber(b.eaten)} kcal mangiate` : "nessun pasto"}, obiettivo ${formatNumber(b.target)} kcal`;
        const isToday = b.date === today;
        return (
          <li key={b.date} className="flex-1">
            <Link href={isToday ? "/" : `/?d=${b.date}`} aria-label={label} className="flex min-h-11 flex-col items-center gap-1 px-0.5">
              <span className="relative block w-full" style={{ height: CHART_HEIGHT }}>
                {avg && <span aria-hidden="true" data-avg-line className="absolute inset-x-0 z-10 block border-t-2 border-dashed border-avg-line" style={{ bottom: `calc(${avg.ratio * 100}% - 1px)` }} />}
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
    </div>
  );
}
