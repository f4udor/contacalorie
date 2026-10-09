import type { DateKey } from "@/engine";
import type { ActivityRecord } from "@/data";
import { parseDecimal } from "./meal-form";

/** Valori dei campi del modulo "Bici a mano", come scritti dall'utente. */
export interface BikeFormValues {
  km: string;
  kcal: string;
}

export type BikeFormErrors = Partial<Record<keyof BikeFormValues | "form", string>>;

/** La parte a mano della bici: km e kcal, almeno uno dei due. */
export interface ParsedBike {
  km: number | null;
  /** Kcal scritte a mano: sostituiscono km a mano × kcal per km. */
  kcal: number | null;
}

/** Numero intero scritto con o senza punti delle migliaia ("9000", "9.000"). */
export function parseWhole(text: string): number | "empty" | "invalid" {
  const t = text.replace(/[\s.]/g, "");
  if (t === "") return "empty";
  return /^\d+$/.test(t) ? Number(t) : "invalid";
}

export function emptyBikeForm(): BikeFormValues {
  return { km: "", kcal: "" };
}

/** Modulo precompilato con la parte a mano già salvata (vuoto se non c'è). */
export function bikeToForm(a: Pick<ActivityRecord, "bikeKmManual" | "bikeKcalManual"> | null): BikeFormValues {
  if (!a) return emptyBikeForm();
  return {
    km: a.bikeKmManual === null ? "" : String(a.bikeKmManual).replace(".", ","),
    kcal: a.bikeKcalManual === null ? "" : String(a.bikeKcalManual).replace(".", ","),
  };
}

/** Controlla il modulo: km anche con decimali, kcal intere; almeno uno dei due, maggiore di zero. */
export function validateBikeForm(v: BikeFormValues): { ok: true; bike: ParsedBike } | { ok: false; errors: BikeFormErrors } {
  const errors: BikeFormErrors = {};
  const out: ParsedBike = { km: null, kcal: null };

  const kcal = parseWhole(v.kcal);
  if (kcal === "invalid") errors.kcal = "Inserisci un numero intero";
  else if (kcal !== "empty") {
    if (kcal <= 0) errors.kcal = "Deve essere maggiore di zero";
    else out.kcal = kcal;
  }

  const km = parseDecimal(v.km);
  if (km === "invalid") errors.km = "Inserisci un numero valido";
  else if (km !== "empty") {
    if (km < 0) errors.km = "Non può essere negativo";
    else if (km === 0) errors.km = "Deve essere maggiore di zero";
    else out.km = km;
  }

  if (Object.keys(errors).length === 0 && out.km === null && out.kcal === null) errors.km = "Inserisci la distanza o le calorie";
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, bike: out };
}

const EMPTY_DAY = (date: DateKey): ActivityRecord => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, bikeKmManual: null, bikeKcalManual: null });

/** Il giorno con la parte a mano della bici sostituita: passi e parte di Salute restano come sono. */
export function withManualBike(date: DateKey, bike: ParsedBike, existing: ActivityRecord | null): ActivityRecord {
  return { ...(existing ?? EMPTY_DAY(date)), bikeKmManual: bike.km, bikeKcalManual: bike.kcal };
}

/** Il giorno senza la parte a mano della bici; null se non ce n'è una. Passi e parte di Salute restano come sono. */
export function withoutManualBike(record: ActivityRecord): ActivityRecord | null {
  if (record.bikeKmManual === null && record.bikeKcalManual === null) return null;
  return { ...record, bikeKmManual: null, bikeKcalManual: null };
}

/** C'è una parte a mano della bici? */
export const hasManualBike = (a: Pick<ActivityRecord, "bikeKmManual" | "bikeKcalManual"> | null | undefined): boolean => !!a && (a.bikeKmManual !== null || a.bikeKcalManual !== null);

/** Controlla il peso in kg: numero maggiore di zero. */
export function validateWeight(text: string): { ok: true; weightKg: number } | { ok: false; error: string } {
  const r = parseDecimal(text);
  if (r === "empty") return { ok: false, error: "Inserisci il peso in kg" };
  if (r === "invalid") return { ok: false, error: "Inserisci un numero valido" };
  if (r <= 0) return { ok: false, error: "Il peso deve essere maggiore di zero" };
  return { ok: true, weightKg: r };
}

/** Il giorno di un'uscita in bici: una data vera, mai futura (nessun giorno oltre oggi). Restituisce il messaggio d'errore, o null se va bene. */
export function validateActivityDay(day: string, today: DateKey): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "Scegli un giorno";
  const [y, m, d] = day.split("-").map(Number);
  const real = new Date(Date.UTC(y, m - 1, d));
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d) return "Scegli un giorno";
  return day > today ? "Scegli un giorno fino a oggi" : null;
}
