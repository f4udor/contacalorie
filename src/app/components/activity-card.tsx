import { bikeKcal } from "@/engine";
import type { Settings } from "@/engine";
import type { ActivityRecord } from "@/data";
import { formatNumber } from "../lib/format";

const SOURCE: Record<string, string> = { manuale: "manuale", salute: "da Salute" };

function Source({ source }: { source: string | null }) {
  if (!source) return null;
  return <span className="rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-muted">{SOURCE[source]}</span>;
}

/** Attività del giorno: passi e bici, con la fonte. Toccandola si modifica. */
export function ActivityCard({ activity, settings, onEdit }: { activity: ActivityRecord | null; settings: Settings; onEdit: () => void }) {
  const hasSteps = activity !== null && activity.steps !== null;
  const hasBike = activity !== null && (activity.bikeKm !== null || activity.bikeKcalHealth !== null);

  return (
    <section aria-label="Attività">
      <h2 className="px-1 pb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">Attività</h2>
      <button type="button" onClick={onEdit} className="block min-h-14 w-full rounded-2xl bg-card px-4 py-3 text-left">
        {!hasSteps && !hasBike ? (
          <span className="block py-1 text-[15px] text-muted">Nessuna attività. Tocca per inserire passi o bici.</span>
        ) : (
          <span className="flex flex-col divide-y divide-line">
            {hasSteps && (
              <span className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="text-[17px] font-semibold">Passi</span>
                <span className="flex items-center gap-2">
                  <Source source={activity.stepsSource} />
                  <span className="text-[17px] font-semibold tabular-nums">{formatNumber(activity.steps ?? 0)}</span>
                </span>
              </span>
            )}
            {hasBike && (
              <span className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="text-[17px] font-semibold">Bici</span>
                <span className="flex items-center gap-2">
                  <Source source={activity.bikeSource} />
                  <span className="text-[17px] font-semibold tabular-nums">
                    {activity.bikeKm !== null && `${formatNumber(activity.bikeKm, 1)} km · `}
                    {formatNumber(bikeKcal(activity, settings))} kcal
                  </span>
                </span>
              </span>
            )}
          </span>
        )}
      </button>
    </section>
  );
}
