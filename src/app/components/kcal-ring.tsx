import type { DateKey, RingColor } from "@/engine";
import { formatNumber } from "../lib/format";
import { ringRole, roleVar } from "../lib/roles";
import { Card, Num } from "./ui/ui";

interface CalorieCardProps {
  remaining: number;
  progress: number;
  color: RingColor;
  eaten: number;
  target: number;
  /** Nessun pasto nel giorno: si mostra solo l'obiettivo, non "0 mangiate". */
  empty: boolean;
  date: DateKey;
  today: DateKey;
  /** Riga di composizione dell'obiettivo («Base 2.100 · bici +400»), solo se c'è qualcosa oltre alla base. */
  composition?: string | null;
}

/**
 * Scheda «Calorie» (BRIEF §10.5): l'anello a sinistra e, a destra, «Rimaste» (o «Oltre») con il numero grande e sotto «2.061 di 2.100».
 * Il colore dell'anello e del numero segue lo stato del giorno (§10.2): oggi o futuro sotto obiettivo → Comando, passato → Sotto.
 */
export function CalorieCard({ remaining, progress, color, eaten, target, empty, date, today, composition }: CalorieCardProps) {
  const role = ringRole(color, date, today);
  const size = 132;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const over = remaining < 0;
  return (
    <Card title="Calorie">
      <div className="mt-2 flex items-center gap-5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--tessera)" strokeWidth={stroke} />
          {progress > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={roleVar(role)}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${c * progress} ${c}`}
              data-ring-role={role}
            />
          )}
        </svg>
        <div className="min-w-0">
          <p className="text-[13px] text-testo-secondario">{over ? "Oltre" : "Rimaste"}</p>
          <Num value={formatNumber(Math.abs(remaining))} unit="kcal" size="lg" tone={empty ? "testo" : role} />
          <p className="mt-2 text-[14px] tabular-nums text-testo-secondario">{empty ? `Obiettivo ${formatNumber(target)}` : `${formatNumber(eaten)} di ${formatNumber(target)}`}</p>
        </div>
      </div>
      {composition && (
        <p className="mt-3 text-[13px] text-testo-secondario" aria-label="Composizione dell'obiettivo">
          {composition}
        </p>
      )}
    </Card>
  );
}
