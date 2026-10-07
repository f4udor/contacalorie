import { DEFAULT_SETTINGS } from "./defaults";
import type { Settings } from "./types";

const MANUAL_KEYS = ["proteinGramsManual", "fatGramsManual"] as const;

function isValidNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/**
 * Unisce impostazioni parziali dell'utente ai default.
 * Valori mancanti o non validi (negativi, non numerici) tornano al default.
 * I grammi manuali sono validi se numeri non negativi oppure null (= formula).
 */
export function mergeSettings(partial?: Record<string, unknown> | null): Settings {
  const result: Settings = { ...DEFAULT_SETTINGS };
  if (!partial || typeof partial !== "object") return result;

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = partial[key];
    if ((MANUAL_KEYS as readonly string[]).includes(key)) {
      if (isValidNumber(value)) (result[key] as number | null) = value;
    } else if (isValidNumber(value)) {
      (result[key] as number) = value;
    }
  }
  return result;
}
