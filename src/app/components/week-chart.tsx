import Link from "next/link";
import type { DateKey } from "@/engine";
import { formatDateLong, formatNumber, formatWeekday } from "../lib/format";
import { ringRole, ROLE_BG, roleVar } from "../lib/roles";
import type { Role } from "../lib/roles";
import { GRID_Y, miniBarRatios, ratioToY, stepPath } from "../lib/week-chart";
import type { WeekBar } from "../lib/week-view";
import { Card } from "./ui/ui";

const CHART_HEIGHT = 168;

/** Griglia orizzontale puntinata dentro un grafico (coordinate 0-100 come la linea dell'obiettivo). */
function Grid() {
  return (
    <>
      {GRID_Y.map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--griglia)" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 5" vectorEffect="non-scaling-stroke" />
      ))}
    </>
  );
}

/**
 * Scheda «Calorie» della Settimana (BRIEF §10.5): sette barre (angoli arrotondati, colore secondo lo stato del giorno), griglia puntinata,
 * linea dell'obiettivo continua e a gradini (anche nei giorni futuri), linea tratteggiata della media (assente senza media), legenda in alto a destra.
 * Barre, linee e griglia hanno una sola scala. Toccare una barra apre quel giorno.
 */
export function WeekChart({ bars, today, avg }: { bars: WeekBar[]; today: DateKey; avg: { kcal: number; ratio: number } | null }) {
  const legend = (
    <p className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-[12px] text-testo-secondario" aria-label="Legenda del grafico">
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-linea-obiettivo" />
        obiettivo
      </span>
      {avg && (
        <span data-avg-label className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
          <span aria-hidden="true" className="block w-4 border-t-2 border-dashed border-linea-media" />
          media {formatNumber(avg.kcal)}
        </span>
      )}
    </p>
  );
  return (
    <Card title="Calorie" aside={legend}>
      <div className="relative mt-3">
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 z-10 w-full" style={{ height: CHART_HEIGHT }}>
          <Grid />
          <path d={stepPath(bars.map((b) => b.targetRatio))} fill="none" stroke="var(--linea-obiettivo)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" data-target-line />
          {avg && <line x1="0" x2="100" y1={ratioToY(avg.ratio)} y2={ratioToY(avg.ratio)} stroke="var(--linea-media)" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" data-avg-line />}
        </svg>
        <ul className="flex" aria-label="Calorie mangiate per giorno">
          {bars.map((b) => {
            const label = `${formatDateLong(b.date)}: ${b.hasMeals ? `${formatNumber(b.eaten)} kcal mangiate` : "nessun pasto"}, obiettivo ${formatNumber(b.target)} kcal`;
            const isToday = b.date === today;
            const role = ringRole(b.color, b.date, today);
            return (
              <li key={b.date} className="min-w-0 flex-1">
                <Link href={isToday ? "/" : `/?d=${b.date}`} aria-label={label} className="flex min-h-11 flex-col items-center gap-1.5">
                  <span className="relative block w-full" style={{ height: CHART_HEIGHT }}>
                    {b.hasMeals && <span className="absolute inset-x-2 bottom-0 block rounded-t-[10px] rounded-b-[4px]" style={{ height: `${Math.max(b.barRatio * 100, 2)}%`, background: roleVar(role) }} />}
                  </span>
                  <span className={`text-[13px] font-semibold ${isToday ? "text-comando" : "text-testo-secondario"}`}>{formatWeekday(b.date).charAt(0)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

/**
 * Mini grafico dei sette giorni (passi, bici): barre sottili su griglia puntinata, scala sul massimo della settimana.
 * Senza dati la griglia resta vuota. Con `letters` sotto ogni barra c'è l'iniziale del giorno (grafico grande dei pannelli).
 */
export function MiniBars({ values, tone, height = 46, dates }: { values: readonly (number | null)[]; tone: Extract<Role, "passi" | "bici">; height?: number; dates?: readonly DateKey[] }) {
  const ratios = miniBarRatios(values);
  return (
    <div aria-hidden="true">
      <div className="relative flex" style={{ height }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          <Grid />
        </svg>
        {ratios.map((r, i) => (
          <div key={i} className="relative flex flex-1 items-end justify-center">
            {r > 0 && <span className={`block w-1.5 rounded-full ${ROLE_BG[tone]}`} style={{ height: `${Math.max(r * 100, 4)}%` }} />}
          </div>
        ))}
      </div>
      {dates && (
        <div className="mt-1.5 flex">
          {dates.map((d) => (
            <span key={d} className="flex-1 text-center text-[13px] font-semibold text-testo-secondario">
              {formatWeekday(d).charAt(0)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
