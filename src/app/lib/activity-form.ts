import type { DateKey } from "@/engine";
import type { ActivityRecord } from "@/data";
import { parseDecimal } from "./meal-form";

/** Valori dei campi del modulo "Attività a mano", come scritti dall'utente. */
export interface ActivityFormValues {
  steps: string;
  km: string;
  kcal: string;
}

export type ActivityFormErrors = Partial<Record<keyof ActivityFormValues, string>>;

export interface ParsedActivity {
  steps: number | null;
  bikeKm: number | null;
  /** Kcal della bici scritte a mano: sostituiscono km × kcal per km. */
  bikeKcal: number | null;
}

/** Numero intero scritto con o senza punti delle migliaia ("9000", "9.000"). */
export function parseWhole(text: string): number | "empty" | "invalid" {
  const t = text.replace(/[\s.]/g, "");
  if (t === "") return "empty";
  return /^\d+$/.test(t) ? Number(t) : "invalid";
}

export function emptyActivityForm(): ActivityFormValues {
  return { steps: "", km: "", kcal: "" };
}

export function activityToForm(a: ActivityRecord | null): ActivityFormValues {
  if (!a) return emptyActivityForm();
  return {
    steps: a.steps === null ? "" : String(a.steps),
    km: a.bikeKm === null ? "" : String(a.bikeKm).replace(".", ","),
    kcal: a.bikeKcalHealth === null ? "" : String(a.bikeKcalHealth).replace(".", ","),
  };
}

/** Controlla il modulo: passi e kcal interi, km anche con decimali; i campi vuoti restano assenti. */
export function validateActivityForm(v: ActivityFormValues): { ok: true; activity: ParsedActivity } | { ok: false; errors: ActivityFormErrors } {
  const errors: ActivityFormErrors = {};
  const out: ParsedActivity = { steps: null, bikeKm: null, bikeKcal: null };

  const steps = parseWhole(v.steps);
  if (steps === "invalid") errors.steps = "Inserisci un numero intero";
  else if (steps !== "empty") out.steps = steps;

  const kcal = parseWhole(v.kcal);
  if (kcal === "invalid") errors.kcal = "Inserisci un numero intero";
  else if (kcal !== "empty") out.bikeKcal = kcal;

  const km = parseDecimal(v.km);
  if (km === "invalid") errors.km = "Inserisci un numero valido";
  else if (km !== "empty") {
    if (km < 0) errors.km = "Non può essere negativo";
    else out.bikeKm = km;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, activity: out };
}

/**
 * Attività del giorno da salvare. La fonte è "manuale" per i valori scritti dall'utente;
 * un valore lasciato com'era mantiene la fonte che aveva (es. "salute").
 */
export function buildActivityRecord(date: DateKey, parsed: ParsedActivity, existing: ActivityRecord | null): ActivityRecord {
  const stepsSame = existing !== null && parsed.steps === existing.steps;
  const bikeSame = existing !== null && parsed.bikeKm === existing.bikeKm && parsed.bikeKcal === existing.bikeKcalHealth;
  return {
    date,
    steps: parsed.steps,
    stepsSource: parsed.steps === null ? null : stepsSame ? existing.stepsSource : "manuale",
    bikeKm: parsed.bikeKm,
    bikeKcalHealth: parsed.bikeKcal,
    bikeSource: parsed.bikeKm === null && parsed.bikeKcal === null ? null : bikeSame ? existing.bikeSource : "manuale",
  };
}

/** Controlla il peso in kg: numero maggiore di zero. */
export function validateWeight(text: string): { ok: true; weightKg: number } | { ok: false; error: string } {
  const r = parseDecimal(text);
  if (r === "empty") return { ok: false, error: "Inserisci il peso in kg" };
  if (r === "invalid") return { ok: false, error: "Inserisci un numero valido" };
  if (r <= 0) return { ok: false, error: "Il peso deve essere maggiore di zero" };
  return { ok: true, weightKg: r };
}
