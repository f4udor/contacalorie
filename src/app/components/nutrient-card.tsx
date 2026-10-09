import type { Light } from "@/engine";
import { formatNumber } from "../lib/format";
import { lightRole, roleVar } from "../lib/roles";
import type { NutrientView } from "../lib/today-view";
import { Num } from "./ui/ui";

const LIGHT_LABEL: Record<Light, string> = {
  verde: "in linea",
  giallo: "da tenere d'occhio",
  rosso: "fuori misura",
  neutro: "",
};

/** Scheda di un nutriente: nome, numero nel colore dello stato con l'obiettivo in grigio, barretta dello stesso colore. */
export function NutrientCard({ n, wide = false, onOpenProfile }: { n: NutrientView; wide?: boolean; onOpenProfile: () => void }) {
  const role = lightRole(n.light);
  return (
    <div className={`min-w-0 rounded-scheda bg-scheda p-4 ${wide ? "col-span-2" : ""}`}>
      <h3 className="text-[14px] text-testo-secondario">{n.name}</h3>
      {n.needsWeight && n.key === "protein" ? (
        <button type="button" onClick={onOpenProfile} className="mt-1 flex min-h-11 items-center text-left text-[15px] font-semibold leading-snug text-comando">
          Completa il profilo
        </button>
      ) : (
        <p className="mt-1 flex items-baseline gap-1.5">
          <Num value={n.empty ? "–" : formatNumber(n.taken, n.decimals)} size="sm" tone={n.empty ? "testo-secondario" : role} />
          <span className="text-[14px] tabular-nums text-testo-secondario">{n.target === null ? "g" : `/ ${formatNumber(n.target, n.decimals)} g`}</span>
        </p>
      )}
      {n.needsWeight && n.key !== "protein" && <p className="mt-1 text-[13px] text-testo-secondario">Manca il peso nel profilo</p>}
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-tessera"
        role="progressbar"
        aria-label={`${n.name}${LIGHT_LABEL[n.light] ? `, ${LIGHT_LABEL[n.light]}` : ""}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(n.progress * 100)}
      >
        <div className="h-full rounded-full" style={{ width: `${n.progress * 100}%`, background: roleVar(role) }} />
      </div>
    </div>
  );
}
