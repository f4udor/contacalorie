import type { ActivityRecord, HealthLinkStatus } from "@/data";
import type { DateKey } from "@/engine";

/** Ore senza un invio riuscito oltre le quali Oggi mostra l'avviso (§5 del brief). */
export const HEALTH_STALE_HOURS = 24;

const HOUR_MS = 3_600_000;

/**
 * Avviso "Nessun dato da Salute da ieri": c'è un codice attivo e da più di 24 ore non arriva un invio riuscito.
 * Se non è mai arrivato nulla si conta dal momento in cui è stato creato il codice. Senza codice, nessun avviso.
 */
export function shouldWarnHealth(link: Pick<HealthLinkStatus, "active" | "codeCreatedAt" | "lastSuccessAt">, now: Date): boolean {
  if (!link.active) return false;
  const reference = link.lastSuccessAt ?? link.codeCreatedAt;
  if (!reference) return false;
  const since = Date.parse(reference);
  if (Number.isNaN(since)) return false;
  return now.getTime() - since > HEALTH_STALE_HOURS * HOUR_MS;
}

export interface ReceivedDay {
  date: DateKey;
  steps: number | null;
  km: number | null;
}

/** Valori arrivati da Salute per i giorni indicati (solo quelli con fonte "salute"); i giorni senza valori non compaiono. */
export function receivedFromHealth(activity: ActivityRecord[], dates: DateKey[]): ReceivedDay[] {
  const out: ReceivedDay[] = [];
  for (const date of dates) {
    const a = activity.find((x) => x.date === date);
    const steps = a && a.stepsSource === "salute" ? a.steps : null;
    const km = a && a.bikeSource === "salute" ? a.bikeKm : null;
    if (steps !== null || km !== null) out.push({ date, steps, km });
  }
  return out;
}

/** "gio 8 gen, 09:00" nell'orario del dispositivo. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  const day = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" }).format(d).replace(".", "");
  const time = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(d);
  return `${day}, ${time}`;
}
