import { daysBetween } from "./dates";
import type { DateKey } from "./types";

export interface ChallengeExercise {
  name: string;
  /** Giorno del piano da cui l'esercizio entra. */
  fromDay: number;
  base: number;
  /** Le ripetizioni valgono per ciascun lato. */
  perSide: boolean;
  /** "day": ripetizioni = numero del giorno. "cycle": base + step × ((giorno − 1) mod cycleLength). */
  progression: "day" | "cycle";
}

export interface ChallengePlan {
  durationDays: number;
  /** Incremento di ripetizioni per passo del ciclo. */
  repStep: number;
  /** Lunghezza del ciclo di ripetizioni, in giorni. */
  cycleLength: number;
  exercises: ChallengeExercise[];
}

export type ChallengeStatus = "non_iniziata" | "in_corso" | "completata";

export interface ChallengeExerciseToday {
  name: string;
  reps: number;
  perSide: boolean;
}

export interface ChallengeDay {
  status: ChallengeStatus;
  /** Numero del giorno (1…durata) solo se in corso. */
  day: number | null;
  exercises: ChallengeExerciseToday[];
}

/** Numero del giorno della sfida per una data, e stato. Prima dell'inizio e dopo la fine: nessun esercizio. */
export function challengeDay(plan: ChallengePlan, startDate: DateKey, date: DateKey): ChallengeDay {
  const day = daysBetween(startDate, date) + 1;
  if (day < 1) return { status: "non_iniziata", day: null, exercises: [] };
  if (day > plan.durationDays) return { status: "completata", day: null, exercises: [] };

  const exercises = plan.exercises
    .filter((e) => day >= e.fromDay)
    .map((e) => ({
      name: e.name,
      reps: e.progression === "day" ? day : e.base + plan.repStep * ((day - 1) % plan.cycleLength),
      perSide: e.perSide,
    }));
  return { status: "in_corso", day, exercises };
}
