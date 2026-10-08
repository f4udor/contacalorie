import type { Settings } from "./types";

/** Anello kcal (BRIEF §3.5), in kcal: costanti del motore, senza campo in Impostazioni né colonna nel database. */
/** Fino a questa distanza sotto l'obiettivo l'anello è ancora verde; più in basso è nel colore d'accento (giornata in corso). */
export const ringGreenBelow = 150;
/** Fino a questo eccesso sopra l'obiettivo l'anello è verde. Uguale a `recoveryMin`: finché è verde non scatta nessun recupero. */
export const ringGreenAbove = 50;
/** Oltre `ringGreenAbove` e fino a questo eccesso l'anello è giallo, poi rosso. */
export const ringYellowAbove = 200;

/** Valori di default di BRIEF §3. */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  baseKcal: 2100,
  floorKcal: 1800,
  bonusShare: 0.5,
  kcalPerKm: 27,
  kcalPerStep: 0.05,
  stepThreshold: 6000,
  freeMealCap: 800,
  recoveryMaxPerDay: 100,
  recoveryMin: ringGreenAbove,
  creditCap: 300,
  proteinPerKg: 1.4,
  proteinPerKgTarget: 1.8,
  fatShare: 0.3,
  fiberMin: 30,
  saltMax: 5,
  margin: 0.1,
  overLimit: 1.5,
  proteinGramsManual: null,
  fatGramsManual: null,
});

