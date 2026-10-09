import type { Light } from "@/engine";
import { formatNumber } from "../lib/format";
import type { NutrientView } from "../lib/today-view";

const FILL: Record<Light, string> = {
  verde: "var(--in-obiettivo)",
  giallo: "var(--attenzione)",
  rosso: "var(--fuori)",
  neutro: "var(--comando)",
};

const LIGHT_LABEL: Record<Light, string> = {
  verde: "in linea",
  giallo: "da tenere d'occhio",
  rosso: "fuori misura",
  neutro: "",
};

/** Scheda di un nutriente: nome, assunto su obiettivo e barretta a semaforo. */
export function NutrientCard({ n, wide = false, onOpenProfile }: { n: NutrientView; wide?: boolean; onOpenProfile: () => void }) {
  return (
    <div className={`rounded-2xl bg-card p-3.5 ${wide ? "col-span-2" : ""}`}>
      <h3 className="text-sm font-semibold text-muted">{n.name}</h3>
      {n.needsWeight && n.key === "protein" ? (
        <button type="button" onClick={onOpenProfile} className="mt-1 flex min-h-11 items-center text-left text-[15px] font-semibold leading-snug text-accent">
          Inserisci il peso
        </button>
      ) : (
        <p className="mt-1 text-[22px] font-bold leading-tight tabular-nums">
          {n.empty ? "–" : formatNumber(n.taken, n.decimals)}
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
