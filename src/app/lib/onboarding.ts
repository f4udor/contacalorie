import { DEFAULT_SETTINGS } from "@/engine";
import type { UserSettings } from "@/data";
import { settingsToForm, validateSettingsForm } from "./settings-form";
import type { SettingsFormErrors } from "./settings-form";

/** Il primo avvio serve a chi non ha nessuna impostazione salvata e non l'ha già fatto o saltato. */
export function needsOnboarding(settings: UserSettings): boolean {
  return settings.onboardingDone !== true && Object.keys(settings).length === 0;
}

export interface OnboardingValues {
  weightKg: string;
  targetWeightKg: string;
  baseKcal: string;
}

/** Valori di partenza: le kcal base sono quelle predefinite, i pesi vuoti. */
export function initialOnboardingValues(): OnboardingValues {
  return { weightKg: "", targetWeightKg: "", baseKcal: settingsToForm({ baseKcal: DEFAULT_SETTINGS.baseKcal }).baseKcal };
}

/** Controlla i tre campi con le stesse regole delle Impostazioni; i campi vuoti non si salvano (restano i valori predefiniti). */
export function onboardingPatch(values: OnboardingValues): { ok: true; patch: UserSettings } | { ok: false; errors: SettingsFormErrors } {
  const r = validateSettingsForm({ ...settingsToForm({}), ...values });
  if (!r.ok) {
    const { weightKg, targetWeightKg, baseKcal } = r.errors;
    return { ok: false, errors: { weightKg, targetWeightKg, baseKcal } };
  }
  const patch: UserSettings = { onboardingDone: true };
  if (r.patch.weightKg !== undefined) patch.weightKg = r.patch.weightKg;
  if (r.patch.targetWeightKg !== undefined) patch.targetWeightKg = r.patch.targetWeightKg;
  if (r.patch.baseKcal !== undefined && r.patch.baseKcal !== DEFAULT_SETTINGS.baseKcal) patch.baseKcal = r.patch.baseKcal;
  return { ok: true, patch };
}

/** Chi salta non salva numeri: segna solo che il primo avvio è passato. */
export const SKIP_PATCH: UserSettings = { onboardingDone: true };
