import { challengeDay } from "@/engine";
import type { ChallengePlan, DateKey } from "@/engine";
import type { ChallengeLogEntry } from "@/data";

export type ExerciseStatus = "da-fare" | "fatto" | "saltato";

export interface ExerciseView {
  /** Identificativo nel registro: il nome dell'esercizio nel piano. */
  id: string;
  name: string;
  /** Ripetizioni da fare: quelle modificate dall'utente, altrimenti quelle del piano. */
  reps: number;
  planReps: number;
  perSide: boolean;
  /** L'esercizio entra proprio oggi. */
  isNew: boolean;
  status: ExerciseStatus;
}

export type ChallengeView =
  | { kind: "senza-data" }
  | { kind: "non-iniziata"; startDate: DateKey }
  | { kind: "completata" }
  | { kind: "in-corso"; day: number; totalDays: number; done: number; exercises: ExerciseView[] };

/** Stato della sfida mattutina per un giorno: giorno N/durata, esercizi con ripetizioni e stato. */
export function buildChallengeView(input: {
  plan: ChallengePlan;
  startDate: DateKey | undefined;
  date: DateKey;
  log: readonly ChallengeLogEntry[];
}): ChallengeView {
  const { plan, startDate, date, log } = input;
  if (!startDate) return { kind: "senza-data" };
  const today = challengeDay(plan, startDate, date);
  if (today.status === "non_iniziata") return { kind: "non-iniziata", startDate };
  if (today.status === "completata" || today.day === null) return { kind: "completata" };

  const day = today.day;
  const exercises: ExerciseView[] = today.exercises.map((e) => {
    const entry = log.find((l) => l.date === date && l.exerciseId === e.name);
    const fromDay = plan.exercises.find((p) => p.name === e.name)?.fromDay;
    return {
      id: e.name,
      name: e.name,
      reps: entry?.reps ?? e.reps,
      planReps: e.reps,
      perSide: e.perSide,
      isNew: fromDay === day,
      status: entry ? entry.status : "da-fare",
    };
  });
  return { kind: "in-corso", day, totalDays: plan.durationDays, done: exercises.filter((e) => e.status === "fatto").length, exercises };
}
