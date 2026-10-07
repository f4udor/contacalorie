import type { Settings } from "./types";

/** Valori di default di BRIEF §3. */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  baseKcal: 2100,
  floorKcal: 1800,
  bonusShare: 0.5,
  kcalPerKm: 27,
  kcalPerStep: 0.05,
  stepThreshold: 6000,
  freeMealCap: 800,
  proteinPerKg: 1.4,
  fatShare: 0.3,
  fiberMin: 30,
  saltMax: 5,
  margin: 0.1,
  overLimit: 1.5,
  proteinGramsManual: null,
  fatGramsManual: null,
});

/** Oltre l'obiettivo kcal fino a questo multiplo l'anello è giallo, poi rosso (BRIEF §3.5). */
export const KCAL_RING_YELLOW_LIMIT = 1.05;
