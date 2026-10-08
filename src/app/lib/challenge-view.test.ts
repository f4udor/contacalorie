import { describe, expect, it } from "vitest";
import { DEFAULT_CHALLENGE_PLAN as plan } from "@/engine";
import type { ChallengeLogEntry } from "@/data";
import { buildChallengeView } from "./challenge-view";

const START = "2026-01-05";
const entry = (date: string, exerciseId: string, status: "fatto" | "saltato", reps: number | null = null): ChallengeLogEntry => ({ date, exerciseId, status, reps });

describe("buildChallengeView", () => {
  it("senza data di inizio", () => {
    expect(buildChallengeView({ plan, startDate: undefined, date: "2026-01-08", log: [] })).toEqual({ kind: "senza-data" });
  });

  it("prima dell'inizio: non iniziata, con la data", () => {
    expect(buildChallengeView({ plan, startDate: "2026-01-12", date: "2026-01-08", log: [] })).toEqual({ kind: "non-iniziata", startDate: "2026-01-12" });
  });

  it("dopo il giorno 30: completata", () => {
    expect(buildChallengeView({ plan, startDate: "2025-11-01", date: "2026-01-08", log: [] })).toEqual({ kind: "completata" });
  });

  it("giorno 4: giorno 4/30, quattro esercizi, dead bug nuovo, nessuno fatto", () => {
    const v = buildChallengeView({ plan, startDate: START, date: "2026-01-08", log: [] });
    expect(v.kind).toBe("in-corso");
    if (v.kind !== "in-corso") return;
    expect(v.day).toBe(4);
    expect(v.totalDays).toBe(30);
    expect(v.done).toBe(0);
    expect(v.exercises.map((e) => [e.name, e.reps, e.isNew])).toEqual([
      ["Push up", 4, false],
      ["Crunch", 20, false],
      ["Crunch incrociati", 10, false],
      ["Dead bug", 10, true],
    ]);
    expect(v.exercises.find((e) => e.name === "Crunch incrociati")?.perSide).toBe(true);
    expect(v.exercises.every((e) => e.status === "da-fare")).toBe(true);
  });

  it("giorno 1: i tre esercizi iniziali sono tutti nuovi", () => {
    const v = buildChallengeView({ plan, startDate: START, date: START, log: [] });
    expect(v.kind === "in-corso" && v.exercises.map((e) => e.isNew)).toEqual([true, true, true]);
  });

  it("fatti, saltati e ripetizioni modificate dal registro del giorno", () => {
    const log = [
      entry("2026-01-08", "Push up", "fatto"),
      entry("2026-01-08", "Crunch", "fatto", 25),
      entry("2026-01-08", "Dead bug", "saltato"),
      entry("2026-01-07", "Crunch incrociati", "fatto"), // di un altro giorno: ignorata
    ];
    const v = buildChallengeView({ plan, startDate: START, date: "2026-01-08", log });
    if (v.kind !== "in-corso") throw new Error("attesa in corso");
    expect(v.done).toBe(2);
    expect(v.exercises.map((e) => e.status)).toEqual(["fatto", "fatto", "da-fare", "saltato"]);
    const crunch = v.exercises.find((e) => e.name === "Crunch")!;
    expect(crunch.reps).toBe(25);
    expect(crunch.planReps).toBe(20);
  });

  it("giorno 30: dodici esercizi", () => {
    const v = buildChallengeView({ plan, startDate: "2025-12-10", date: "2026-01-08", log: [] });
    expect(v.kind === "in-corso" && v.day).toBe(30);
    expect(v.kind === "in-corso" && v.exercises).toHaveLength(12);
  });
});
