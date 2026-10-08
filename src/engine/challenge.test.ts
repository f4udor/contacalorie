import { describe, expect, it } from "vitest";
import { challengeDay } from "./challenge";
import type { ChallengePlan } from "./challenge";
import { DEFAULT_CHALLENGE_PLAN as plan } from "./challenge-plan";
import { addDays } from "./dates";

const START = "2026-01-05";
const onDay = (n: number) => challengeDay(plan, START, addDays(START, n - 1));
const toMap = (n: number) => Object.fromEntries(onDay(n).exercises.map((e) => [e.name, e.reps]));

describe("challengeDay", () => {
  it("giorno 1: push up 1, crunch 20, crunch incrociati 10 per lato", () => {
    const d = onDay(1);
    expect(d.status).toBe("in_corso");
    expect(d.day).toBe(1);
    expect(d.exercises).toEqual([
      { name: "Push up", reps: 1, perSide: false },
      { name: "Crunch", reps: 20, perSide: false },
      { name: "Crunch incrociati", reps: 10, perSide: true },
    ]);
  });

  it("giorno 4: push up 4, crunch 20, crunch incrociati 10, dead bug 10", () => {
    expect(onDay(4).exercises.map((e) => [e.name, e.reps])).toEqual([
      ["Push up", 4],
      ["Crunch", 20],
      ["Crunch incrociati", 10],
      ["Dead bug", 10],
    ]);
  });

  it("giorno 6: crunch 30", () => {
    expect(toMap(6)["Crunch"]).toBe(30);
  });

  it("giorno 30: 12 esercizi", () => {
    expect(onDay(30).exercises).toHaveLength(12);
    expect(toMap(30)["Push up"]).toBe(30);
  });

  it("ogni esercizio entra dal suo giorno", () => {
    const entrata: Record<string, number> = {};
    for (let n = 1; n <= 30; n++) {
      for (const e of onDay(n).exercises) entrata[e.name] ??= n;
    }
    expect(Object.values(entrata)).toEqual([1, 1, 1, 4, 7, 10, 13, 16, 19, 22, 25, 28]);
  });

  it("le ripetizioni seguono base + 5 × ((giorno − 1) mod 3)", () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => toMap(n)["Crunch"])).toEqual([20, 25, 30, 20, 25, 30]);
  });

  it("prima dell'inizio: non iniziata, nessun esercizio", () => {
    const d = challengeDay(plan, START, "2026-01-04");
    expect(d).toEqual({ status: "non_iniziata", day: null, exercises: [] });
  });

  it("dopo il giorno 30: completata, nessun esercizio", () => {
    const d = challengeDay(plan, START, addDays(START, 30));
    expect(d).toEqual({ status: "completata", day: null, exercises: [] });
  });

  it("il giorno 30 è ancora in corso", () => {
    expect(onDay(30).status).toBe("in_corso");
  });

  it("il piano è un dato: un altro piano dà un altro risultato", () => {
    const mini: ChallengePlan = {
      durationDays: 2,
      repStep: 2,
      cycleLength: 2,
      exercises: [{ name: "Salto", fromDay: 2, base: 7, perSide: false, progression: "cycle" }],
    };
    expect(challengeDay(mini, START, START).exercises).toEqual([]);
    expect(challengeDay(mini, START, "2026-01-06").exercises).toEqual([{ name: "Salto", reps: 9, perSide: false }]);
    expect(challengeDay(mini, START, "2026-01-07").status).toBe("completata");
  });
});
