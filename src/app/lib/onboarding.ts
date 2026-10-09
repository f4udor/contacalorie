import { resolveSettings } from "@/engine";
import type { DateKey } from "@/engine";
import type { UserSettings } from "@/data";
import { validateSettingsFields } from "./settings-form";
import type { SettingsFieldKey, SettingsFormErrors, SettingsFormValues } from "./settings-form";

/** Il primo avvio serve a chi non ha nessuna impostazione salvata e non l'ha già fatto o saltato. */
export function needsOnboarding(settings: UserSettings): boolean {
  return settings.onboardingDone !== true && Object.keys(settings).length === 0;
}

export type OnboardingKey = Extract<SettingsFieldKey, "sex" | "ageYears" | "heightCm" | "weightKg" | "targetWeightKg" | "targetDate" | "baseKcal">;
export type OnboardingValues = Record<OnboardingKey, string>;

/** I campi di ogni schermata; l'ultima mostra le kcal base calcolate (e permette di cambiarle a mano). */
export const ONBOARDING_STEPS: readonly (readonly OnboardingKey[])[] = [
  ["sex", "ageYears", "heightCm"],
  ["weightKg", "targetWeightKg", "targetDate"],
  ["baseKcal"],
];

/** Tutto vuoto: la kcal base vuota significa "calcolata dal profilo". */
export function initialOnboardingValues(): OnboardingValues {
  return { sex: "", ageYears: "", heightCm: "", weightKg: "", targetWeightKg: "", targetDate: "", baseKcal: "" };
}

const ALL_KEYS = ONBOARDING_STEPS.flat();
const asForm = (values: OnboardingValues): SettingsFormValues => ({ ...Object.fromEntries(ALL_KEYS.map((k) => [k, ""])), ...values }) as SettingsFormValues;

/** Controlla i campi indicati con le stesse regole delle Impostazioni (le schermate controllano solo i propri). */
export function checkOnboardingStep(values: OnboardingValues, keys: readonly OnboardingKey[]): SettingsFormErrors {
  const r = validateSettingsFields(asForm(values), keys);
  return r.ok ? {} : r.errors;
}

/** Ciò che si salva alla fine: solo i campi scritti, più il segno di avvio fatto. La kcal base si salva solo se è stata scritta a mano. */
export function onboardingPatch(values: OnboardingValues): { ok: true; patch: UserSettings } | { ok: false; errors: SettingsFormErrors } {
  const r = validateSettingsFields(asForm(values), ALL_KEYS);
  if (!r.ok) return { ok: false, errors: r.errors };
  const patch: Record<string, unknown> = { onboardingDone: true };
  for (const [k, v] of Object.entries(r.patch)) if (v !== undefined) patch[k] = v;
  return { ok: true, patch: patch as UserSettings };
}

/** Chi salta non salva numeri: segna solo che il primo avvio è passato. */
export const SKIP_PATCH: UserSettings = { onboardingDone: true };

export interface OnboardingSummary {
  /** Kcal base che userà l'app (scritta a mano o calcolata; con il profilo incompleto, quella predefinita). */
  baseKcal: number;
  /** Metabolismo basale arrotondato (la base non scende sotto): null con il profilo incompleto. */
  minimum: number | null;
  /** Il profilo è completo: la base è calcolata. */
  calculated: boolean;
  /** Prima data possibile se quella scelta non è raggiungibile. */
  earliestDate: DateKey | null;
}

/** Il riepilogo dell'ultima schermata, dai valori scritti (nulla se non sono validi). */
export function onboardingSummary(values: OnboardingValues, today: DateKey): OnboardingSummary | null {
  const r = onboardingPatch(values);
  if (!r.ok) return null;
  const { settings, plan } = resolveSettings(r.patch as Record<string, unknown>, today);
  return { baseKcal: settings.baseKcal, minimum: plan?.minimum ?? null, calculated: plan !== null, earliestDate: plan?.unreachable ? plan.earliestDate : null };
}
