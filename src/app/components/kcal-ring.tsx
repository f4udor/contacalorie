import type { RingColor } from "@/engine";
import { formatNumber } from "../lib/format";

const STROKE: Record<RingColor, string> = {
  accento: "var(--accent)",
  giallo: "var(--warn-fill)",
  rosso: "var(--bad-fill)",
  neutro: "var(--track)",
};

interface KcalRingProps {
  remaining: number;
  progress: number;
  color: RingColor;
  eaten: number;
  target: number;
}

/** Anello delle kcal: al centro quelle rimaste, o di quanto si è sopra l'obiettivo. */
export function KcalRing({ remaining, progress, color, eaten, target }: KcalRingProps) {
  const size = 220;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const over = remaining < 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
          {progress > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={STROKE[color]}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${c * progress} ${c}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-bold leading-none tracking-tight tabular-nums">{formatNumber(Math.abs(remaining))}</span>
          <span className="mt-1 text-sm font-medium text-muted">{over ? "kcal sopra di" : "kcal rimaste"}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Mangiate <span className="font-semibold text-fg tabular-nums">{formatNumber(eaten)}</span> su{" "}
        <span className="font-semibold text-fg tabular-nums">{formatNumber(target)}</span> kcal
      </p>
    </div>
  );
}
