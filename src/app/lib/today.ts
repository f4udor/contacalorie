import type { DateKey } from "@/engine";

/** Data di oggi sul dispositivo (fuso locale), nel formato AAAA-MM-GG. Solo per lo strato schermate. */
export function todayKey(now: Date = new Date()): DateKey {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
