import { bikeKcal, bikeKmTotal } from "@/engine";
import type { Settings } from "@/engine";
import type { ActivityRecord } from "@/data";
import { formatNumber } from "../lib/format";

function Badge({ children }: { children: string }) {
  return <span className="rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-muted">{children}</span>;
}

/** "12,4 km · 410 kcal" / "8 km" / "250 kcal": le parti presenti di una delle due metà della bici. */
function partText(km: number | null, kcal: number | null): string {
  return [km !== null ? `${formatNumber(km, 1)} km` : null, kcal !== null ? `${formatNumber(kcal)} kcal` : null].filter(Boolean).join(" · ");
}

/**
 * Attività del giorno: passi (in sola lettura) e bici. La bici mostra il totale del giorno; se ci sono entrambe le parti
 * anche il dettaglio. Si tocca solo la parte inserita a mano, che si modifica o si elimina.
 */
export function ActivityCard({ activity, settings, onEditBike }: { activity: ActivityRecord | null; settings: Settings; onEditBike: () => void }) {
  const hasSteps = activity !== null && activity.steps !== null;
  const hasHealthBike = activity !== null && (activity.bikeKm !== null || activity.bikeKcalHealth !== null);
  const hasManualBike = activity !== null && (activity.bikeKmManual !== null || activity.bikeKcalManual !== null);
  const hasBike = hasHealthBike || hasManualBike;
  const km = activity ? bikeKmTotal(activity) : null;
  const manualText = activity ? partText(activity.bikeKmManual, activity.bikeKcalManual) : "";

  const total = hasBike && activity && (
    <>
      <span className="text-[17px] font-semibold">Bici</span>
      <span className="flex items-center gap-2">
        {hasHealthBike && !hasManualBike && <Badge>da Salute</Badge>}
        {hasManualBike && !hasHealthBike && <Badge>a mano</Badge>}
        <span className="text-[17px] font-semibold tabular-nums">
          {km !== null && `${formatNumber(km, 1)} km · `}
          {formatNumber(bikeKcal(activity, settings))} kcal
        </span>
      </span>
    </>
  );

  return (
    <section aria-label="Attività">
      <h2 className="px-1 pb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">Attività</h2>
      <div className="rounded-2xl bg-card px-4 py-3">
        {!hasSteps && !hasBike ? (
          <span className="block py-1 text-[15px] text-muted">Nessuna attività</span>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {hasSteps && (
              <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="text-[17px] font-semibold">Passi</span>
                <span className="flex items-center gap-2">
                  {activity.stepsSource === "salute" && <Badge>da Salute</Badge>}
                  <span className="text-[17px] font-semibold tabular-nums">{formatNumber(activity.steps ?? 0)}</span>
                </span>
              </div>
            )}
            {hasBike && activity && (
              <div className="py-2 first:pt-0 last:pb-0">
                {hasManualBike && !hasHealthBike ? (
                  <button type="button" onClick={onEditBike} aria-label="Modifica la bici a mano" className="-my-1 flex min-h-11 w-full items-center justify-between gap-3 text-left">
                    {total}
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-3">{total}</div>
                )}
                {hasManualBike && hasHealthBike && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-1 text-sm text-muted">
                    <span>{partText(activity.bikeKm, activity.bikeKcalHealth)} da Salute</span>
                    <span aria-hidden="true">+</span>
                    <button type="button" onClick={onEditBike} aria-label="Modifica la bici a mano" className="-my-1.5 min-h-11 rounded-lg px-1 font-semibold text-accent">
                      {manualText} a mano
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
