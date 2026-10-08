import Link from "next/link";
import type { Light } from "@/engine";
import { formatNumber } from "../lib/format";
import type { NutrientView } from "../lib/today-view";

const FILL: Record<Light, string> = {
  verde: "var(--ok-fill)",
  giallo: "var(--warn-fill)",
  rosso: "var(--bad-fill)",
  neutro: "var(--accent)",
};

const LIGHT_LABEL: Record<Light, string> = {
  verde: "in linea",
  giallo: "da tenere d'occhio",
  rosso: "fuori misura",
  neutro: "",
};

/** Scheda di un nutriente: nome, assunto su obiettivo e barretta a semaforo. */
export function NutrientCard({ n }: { n: NutrientView }) {
  return (
    <div className="rounded-2xl bg-card p-3.5">
      <h3 className="text-sm font-semibold text-muted">{n.name}</h3>
      {n.needsWeight && n.key === "protein" ? (
        <Link href="/impostazioni" className="mt-1 flex min-h-11 items-center text-[15px] font-semibold leading-snug text-accent">
          Inserisci il peso
        </Link>
      ) : (
        <p className="mt-1 text-[22px] font-bold leading-tight tabular-nums">
          {formatNumber(n.taken, n.decimals)}
          <span className="text-[15px] font-medium text-muted">
            {n.target === null ? " g" : ` / ${formatNumber(n.target, n.decimals)} g`}
          </span>
        </p>
      )}
      {n.needsWeight && n.key !== "protein" && <p className="mt-1 text-xs text-muted">Obiettivo dopo il peso</p>}
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-track"
        role="progressbar"
        aria-label={`${n.name}${LIGHT_LABEL[n.light] ? `, ${LIGHT_LABEL[n.light]}` : ""}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(n.progress * 100)}
      >
        <div className="h-full rounded-full" style={{ width: `${n.progress * 100}%`, background: FILL[n.light] }} />
      </div>
    </div>
  );
}
