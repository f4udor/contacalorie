import type { ChallengePlan } from "./challenge";

/** Piano precaricato di 30 giorni (BRIEF §6). */
export const DEFAULT_CHALLENGE_PLAN: ChallengePlan = {
  durationDays: 30,
  repStep: 5,
  cycleLength: 3,
  exercises: [
    { name: "Push up", fromDay: 1, base: 0, perSide: false, progression: "day" },
    { name: "Crunch", fromDay: 1, base: 20, perSide: false, progression: "cycle" },
    { name: "Crunch incrociati", fromDay: 1, base: 10, perSide: true, progression: "cycle" },
    { name: "Dead bug", fromDay: 4, base: 10, perSide: true, progression: "cycle" },
    { name: "Tocchi ai talloni", fromDay: 7, base: 10, perSide: true, progression: "cycle" },
    { name: "Ponte glutei", fromDay: 10, base: 10, perSide: false, progression: "cycle" },
    { name: "Bird dog", fromDay: 13, base: 10, perSide: true, progression: "cycle" },
    { name: "Squat", fromDay: 16, base: 10, perSide: false, progression: "cycle" },
    { name: "Plank laterale con discesa bacino", fromDay: 19, base: 10, perSide: true, progression: "cycle" },
    { name: "Superman", fromDay: 22, base: 10, perSide: false, progression: "cycle" },
    { name: "Russian twist (piedi a terra)", fromDay: 25, base: 10, perSide: true, progression: "cycle" },
    { name: "Plank con tocco spalla", fromDay: 28, base: 10, perSide: true, progression: "cycle" },
  ],
};
