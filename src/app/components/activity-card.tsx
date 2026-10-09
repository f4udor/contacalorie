import { bikeKcal, bikeKmTotal } from "@/engine";
import type { Settings } from "@/engine";
import type { ActivityRecord } from "@/data";
import { formatNumber } from "../lib/format";
import { Card, Num } from "./ui/ui";

/** "12,4 km · 410 kcal" / "8 km" / "250 kcal": le parti presenti di una delle due metà della bici. */
function partText(km: number | null, kcal: number | null): string {
  return [km !== null ? `${formatNumber(km, 1)} km` : null, kcal !== null ? `${formatNumber(kcal)} kcal` : null].filter(Boolean).join(" · ");
}

/**
 * Passi e Bici: due schede affiancate con i loro colori (BRIEF §10.5). I passi sono in sola lettura; la bici mostra il totale del giorno
 * e, se ci sono entrambe le parti, il dettaglio: si tocca solo la parte inserita a mano, che si modifica o si elimina. Senza dati, un trattino.
 */
export function ActivityCards({ activity, settings, onEditBike }: { activity: ActivityRecord | null; settings: Settings; onEditBike: () => void }) {
  const hasSteps = activity !== null && activity.steps !== null;
  const hasHealthBike = activity !== null && (activity.bikeKm !== null || activity.bikeKcalHealth !== null);
  const hasManualBike = activity !== null && (activity.bikeKmManual !== null || activity.bikeKcalManual !== null);
  const hasBike = hasHealthBike || hasManualBike;
  const km = activity ? bikeKmTotal(activity) : null;
  const manualText = activity ? partText(activity.bikeKmManual, activity.bikeKcalManual) : "";

  const bikeBody = (
    <>
      <div className="mt-3">{hasBike && activity ? <BikeNumber km={km} kcal={bikeKcal(activity, settings)} /> : <Num value="–" size="lg" tone="testo-secondario" />}</div>
      {hasBike && activity && (
        <p className="mt-1.5 text-[13px] text-testo-secondario">{km !== null ? `${formatNumber(bikeKcal(activity, settings))} kcal` : ""}</p>
      )}
    </>
  );

  return (
    <section aria-label="Passi e bici" className="grid grid-cols-2 gap-3">
      <Card title="Passi">
        <div className="mt-3">
          {hasSteps && activity ? <Num value={formatNumber(activity.steps ?? 0)} size="lg" tone="passi" /> : <Num value="–" size="lg" tone="testo-secondario" />}
        </div>
        {hasSteps && activity && <p className="mt-1.5 text-[13px] text-testo-secondario">{activity.stepsSource === "salute" ? "da Salute" : "a mano"}</p>}
      </Card>
      {hasManualBike && !hasHealthBike ? (
        <Card title="Bici" onOpen={onEditBike} openLabel="Modifica la bici a mano">
          {bikeBody}
          <p className="mt-0.5 text-[13px] text-testo-secondario">a mano</p>
        </Card>
      ) : (
        <Card title="Bici">
          {bikeBody}
          {hasHealthBike && !hasManualBike && <p className="mt-0.5 text-[13px] text-testo-secondario">da Salute</p>}
          {hasManualBike && hasHealthBike && activity && (
            <p className="mt-0.5 text-[13px] text-testo-secondario">
              <span>{partText(activity.bikeKm, activity.bikeKcalHealth)} da Salute</span> +{" "}
              <button type="button" onClick={onEditBike} aria-label="Modifica la bici a mano" className="min-h-11 text-left font-semibold text-comando">
                {manualText} a mano
              </button>
            </p>
          )}
        </Card>
      )}
    </section>
  );
}

function BikeNumber({ km, kcal }: { km: number | null; kcal: number }) {
  return km !== null ? <Num value={formatNumber(km, 1)} unit="km" size="lg" tone="bici" /> : <Num value={formatNumber(kcal)} unit="kcal" size="lg" tone="bici" />;
}
