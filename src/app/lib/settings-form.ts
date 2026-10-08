import type { UserSettings } from "@/data";
import { parseWhole } from "./activity-form";
import { parseDecimal } from "./meal-form";

export type SettingsFieldKey =
  | "weightKg"
  | "heightCm"
  | "ageYears"
  | "targetWeightKg"
  | "baseKcal"
  | "floorKcal"
  | "proteinGramsManual"
  | "fatGramsManual"
  | "fiberMin"
  | "saltMax"
  | "margin"
  | "kcalPerKm"
  | "kcalPerStep"
  | "stepThreshold"
  | "bonusShare"
  | "freeMealCap"
  | "challengeStartDate";

type Kind = "decimal" | "whole" | "percent" | "date";

interface FieldRule {
  kind: Kind;
  /** Valore minimo ammesso; con `positive` lo zero è escluso. */
  min: number;
  positive?: boolean;
  /** Valore massimo ammesso (per i percentuali, in punti percentuali). */
  max: number;
}

/** Limiti di buon senso per i campi: servono a respingere errori di battitura, non sono regole di calcolo. */
export const FIELD_RULES: Record<SettingsFieldKey, FieldRule> = {
  weightKg: { kind: "decimal", min: 0, positive: true, max: 500 },
  heightCm: { kind: "decimal", min: 0, positive: true, max: 300 },
  ageYears: { kind: "whole", min: 1, max: 120 },
  targetWeightKg: { kind: "decimal", min: 0, positive: true, max: 500 },
  baseKcal: { kind: "decimal", min: 0, positive: true, max: 10000 },
  floorKcal: { kind: "decimal", min: 0, max: 10000 },
  proteinGramsManual: { kind: "decimal", min: 0, max: 1000 },
  fatGramsManual: { kind: "decimal", min: 0, max: 1000 },
  fiberMin: { kind: "decimal", min: 0, max: 200 },
  saltMax: { kind: "decimal", min: 0, positive: true, max: 100 },
  margin: { kind: "percent", min: 0, max: 50 },
  kcalPerKm: { kind: "decimal", min: 0, max: 200 },
  kcalPerStep: { kind: "decimal", min: 0, max: 1 },
  stepThreshold: { kind: "whole", min: 0, max: 100000 },
  bonusShare: { kind: "percent", min: 0, max: 100 },
  freeMealCap: { kind: "decimal", min: 0, max: 5000 },
  challengeStartDate: { kind: "date", min: 0, max: 0 },
};

export const FIELD_KEYS = Object.keys(FIELD_RULES) as SettingsFieldKey[];

/** Campi del profilo e della sfida: "Ripristina valori predefiniti" non li tocca. */
export const PERSONAL_KEYS: readonly SettingsFieldKey[] = ["weightKg", "heightCm", "ageYears", "targetWeightKg", "challengeStartDate"];

export type SettingsFormValues = Record<SettingsFieldKey, string>;
export type SettingsFormErrors = Partial<Record<SettingsFieldKey, string>>;
export type SettingsPatch = { [K in SettingsFieldKey]?: UserSettings[K] | undefined };

const text = (n: number) => String(Math.round(n * 1e6) / 1e6).replace(".", ",");

/** Valori del modulo a partire dalle impostazioni salvate; un campo non impostato è vuoto. */
export function settingsToForm(s: UserSettings): SettingsFormValues {
  const out = {} as SettingsFormValues;
  for (const key of FIELD_KEYS) {
    const v = s[key];
    if (v === undefined || v === null) out[key] = "";
    else if (FIELD_RULES[key].kind === "percent") out[key] = text((v as number) * 100);
    else if (typeof v === "number") out[key] = text(v);
    else out[key] = String(v);
  }
  return out;
}

function isRealDate(t: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function checkRange(n: number, rule: FieldRule, suffix = ""): string | null {
  if (rule.positive ? n <= 0 : n < rule.min) return rule.positive ? "Deve essere maggiore di zero" : "Non può essere negativo";
  if (n > rule.max) return `Al massimo ${String(rule.max).replace(".", ",")}${suffix}`;
  return null;
}

/**
 * Controlla tutto il modulo. Un campo vuoto significa "usa il valore predefinito" (viene tolto dalle impostazioni salvate).
 * Se un solo campo non è valido non si salva nulla.
 */
export function validateSettingsForm(values: SettingsFormValues): { ok: true; patch: SettingsPatch } | { ok: false; errors: SettingsFormErrors } {
  const errors: SettingsFormErrors = {};
  const patch: Record<string, number | string | undefined> = {};

  for (const key of FIELD_KEYS) {
    const rule = FIELD_RULES[key];
    const raw = values[key];

    if (rule.kind === "date") {
      const t = raw.trim();
      if (t === "") patch[key] = undefined;
      else if (!isRealDate(t)) errors[key] = "Data non valida";
      else patch[key] = t;
      continue;
    }

    const r = rule.kind === "whole" ? parseWhole(raw) : parseDecimal(raw);
    if (r === "empty") {
      patch[key] = undefined;
    } else if (r === "invalid") {
      errors[key] = rule.kind === "whole" ? "Inserisci un numero intero" : "Inserisci un numero valido";
    } else {
      const err = checkRange(r, rule, rule.kind === "percent" ? " %" : "");
      if (err) errors[key] = err;
      else patch[key] = rule.kind === "percent" ? Math.round(r * 1e4) / 1e6 : r;
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, patch: patch as SettingsPatch };
}

/** Patch che toglie tutte le regole personalizzate e lascia profilo e data della sfida. */
export function defaultsPatch(): SettingsPatch {
  const patch: Record<string, undefined> = {};
  for (const key of FIELD_KEYS) if (!PERSONAL_KEYS.includes(key)) patch[key] = undefined;
  return patch as SettingsPatch;
}
