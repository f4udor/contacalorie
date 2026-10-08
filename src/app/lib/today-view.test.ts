import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/engine";
import type { Activity, Day, Meal } from "@/engine";
import { buildTodayView, currentWeight, hasCompositionDetail } from "./today-view";

const s = DEFAULT_SETTINGS;
const noAct: Activity = { steps: null, bikeKm: null, bikeKcalHealth: null };

function meal(id: string, kcal: number, extra: Partial<Meal> = {}): Meal {
  return { id, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false, ...extra };
}
function day(date: string, meals: Meal[] = [], activity: Partial<Activity> = {}): Day {
  return { date, meals, activity: { ...noAct, ...activity } };
}
const week = (...overrides: Day[]): Day[] =>
  ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-11"].map(
    (d) => overrides.find((o) => o.date === d) ?? day(d),
  );

describe("currentWeight", () => {
  const w = [{ date: "2026-01-02", weightKg: 95 }, { date: "2026-01-06", weightKg: 94 }, { date: "2026-01-20", weightKg: 90 }];
  it("ultima pesata fino a quel giorno", () => {
    expect(currentWeight(w, "2026-01-08", 100)).toBe(94);
    expect(currentWeight(w, "2026-01-06", 100)).toBe(94);
  });
  it("senza pesate usa il peso del profilo", () => {
    expect(currentWeight([], "2026-01-08", 100)).toBe(100);
  });
  it("pesate solo successive: profilo, altrimenti la prima pesata", () => {
    expect(currentWeight(w, "2026-01-01", 100)).toBe(100);
    expect(currentWeight(w, "2026-01-01", undefined)).toBe(95);
  });
  it("nessuno dei due: null", () => {
    expect(currentWeight([], "2026-01-08", undefined)).toBeNull();
    expect(currentWeight([], "2026-01-08", 0)).toBeNull();
  });
});

describe("buildTodayView", () => {
  it("giorno vuoto: obiettivo 2.100, tutte kcal rimaste, barrette neutre", () => {
    const v = buildTodayView({ date: "2026-01-05", days: week(), settings: s, weightKg: 100 });
    expect(v.hasMeals).toBe(false);
    expect(v.target).toBe(2100);
    expect(v.remaining).toBe(2100);
    expect(v.ringColor).toBe("accento");
    expect(v.ringProgress).toBe(0);
    expect(v.composition).toEqual([{ label: "Base", amount: 2100, signed: false }]);
    expect(v.nutrients.every((n) => n.light === "neutro" && n.empty)).toBe(true);
    expect(v.nutrients.find((n) => n.key === "protein")?.target).toBe(140);
  });

  it("con pasti le schede non sono vuote", () => {
    const v = buildTodayView({ date: "2026-01-05", days: week(day("2026-01-05", [meal("a", 100)])), settings: s, weightKg: 100 });
    expect(v.nutrients.every((n) => !n.empty)).toBe(true);
  });

  it("caso B: giovedì con recupero → obiettivo 1.994, recupero −106", () => {
    const days = week(
      day("2026-01-05", [meal("a", 1750)]),
      day("2026-01-06", [meal("b", 1800)]),
      day("2026-01-07", [meal("c", 3250)], { steps: 9000 }),
      day("2026-01-08", [meal("d", 900)]),
    );
    const v = buildTodayView({ date: "2026-01-08", days, settings: s, weightKg: 100 });
    expect(v.target).toBe(1994);
    expect(v.remaining).toBe(1094);
    expect(v.composition).toEqual([
      { label: "Base", amount: 2100, signed: false },
      { label: "recupero", amount: -106, signed: true },
    ]);
  });

  it("caso E: giorno di bici → obiettivo 2.505, bonus bici 405, carboidrati 329", () => {
    const days = week(day("2026-01-05", [meal("a", 1500)], { bikeKm: 30 }));
    const v = buildTodayView({ date: "2026-01-05", days, settings: s, weightKg: 100 });
    expect(v.target).toBe(2505);
    expect(v.composition).toEqual([
      { label: "Base", amount: 2100, signed: false },
      { label: "bici", amount: 405, signed: true },
    ]);
    expect(v.nutrients.find((n) => n.key === "carbs")?.target).toBe(329);
  });

  it("composizione con bici, passi e recupero insieme, solo voci diverse da zero", () => {
    const days = week(
      day("2026-01-05", [meal("a", 3000)]),
      day("2026-01-06", [meal("b", 1500)], { bikeKm: 30, steps: 9000 }),
    );
    const v = buildTodayView({ date: "2026-01-06", days, settings: s, weightKg: 100 });
    expect(v.composition.map((c) => c.label)).toEqual(["Base", "bici", "passi", "recupero"]);
  });

  it("sopra l'obiettivo: kcal rimaste negative e anello rosso", () => {
    const days = week(day("2026-01-05", [meal("a", 2800)]));
    const v = buildTodayView({ date: "2026-01-05", days, settings: s, weightKg: 100 });
    expect(v.remaining).toBe(-700);
    expect(v.ringColor).toBe("rosso");
    expect(v.ringProgress).toBe(1);
  });

  it("pasto libero: le kcal rimaste usano il budget, le mangiate quelle reali", () => {
    const days = week(day("2026-01-05", [meal("a", 2250, { isFree: true })]));
    const v = buildTodayView({ date: "2026-01-05", days, settings: s, weightKg: 100 });
    expect(v.eaten).toBe(2250);
    expect(v.budget).toBe(800);
    expect(v.remaining).toBe(1300);
  });

  it("semafori dei nutrienti con i pasti del giorno (casi I e J)", () => {
    const days = week(day("2026-01-05", [meal("a", 1500, { protein: 125, carbs: 228, fat: 70, fiber: 30, salt: 4.8 })]));
    const v = buildTodayView({ date: "2026-01-05", days, settings: s, weightKg: 100 });
    const light = (k: string) => v.nutrients.find((n) => n.key === k)?.light;
    expect(light("protein")).toBe("giallo");
    expect(light("carbs")).toBe("verde");
    expect(light("fat")).toBe("verde");
    expect(light("fiber")).toBe("verde");
    expect(light("salt")).toBe("giallo");
  });

  it("senza peso: la scheda proteine e quella dei carboidrati non hanno obiettivo", () => {
    const days = week(day("2026-01-05", [meal("a", 500, { protein: 20, carbs: 50, fat: 10 })]));
    const v = buildTodayView({ date: "2026-01-05", days, settings: s, weightKg: null });
    const protein = v.nutrients.find((n) => n.key === "protein")!;
    const carbs = v.nutrients.find((n) => n.key === "carbs")!;
    expect(protein).toMatchObject({ target: null, needsWeight: true, light: "neutro", progress: 0 });
    expect(carbs).toMatchObject({ target: null, needsWeight: true });
    expect(v.nutrients.find((n) => n.key === "fat")?.target).toBe(70);
  });

  it("senza peso ma con proteine manuali: nessun invito", () => {
    const v = buildTodayView({ date: "2026-01-05", days: week(), settings: { ...s, proteinGramsManual: 120 }, weightKg: null });
    expect(v.nutrients.find((n) => n.key === "protein")).toMatchObject({ target: 120, needsWeight: false });
  });

  it("avanzamento delle barrette limitato a 1", () => {
    const days = week(day("2026-01-05", [meal("a", 500, { protein: 400 })]));
    const v = buildTodayView({ date: "2026-01-05", days, settings: s, weightKg: 100 });
    expect(v.nutrients.find((n) => n.key === "protein")?.progress).toBe(1);
  });
});

describe("proteine sul peso obiettivo", () => {
  it("con peso obiettivo impostato le proteine usano 1,8 × peso obiettivo (caso K: 105 → 85 kg = 155 g)", () => {
    const v = buildTodayView({ date: "2026-01-05", days: week(), settings: s, weightKg: 105, targetWeightKg: 85 });
    expect(v.nutrients.find((n) => n.key === "protein")?.target).toBe(155);
  });
  it("con il solo peso obiettivo non serve il peso attuale", () => {
    const v = buildTodayView({ date: "2026-01-05", days: week(), settings: s, weightKg: null, targetWeightKg: 85 });
    expect(v.nutrients.find((n) => n.key === "protein")).toMatchObject({ target: 155, needsWeight: false });
  });
  it("senza peso obiettivo: 1,4 × peso", () => {
    const v = buildTodayView({ date: "2026-01-05", days: week(), settings: s, weightKg: 100, targetWeightKg: null });
    expect(v.nutrients.find((n) => n.key === "protein")?.target).toBe(140);
  });
});

describe("hasCompositionDetail (riga di composizione sotto l'anello)", () => {
  const view = (days: Day[], date: string) => buildTodayView({ date, days, settings: s, weightKg: 100 });
  it("solo la base: la riga non compare", () => {
    const v = view(week(day("2026-01-05", [meal("a", 1500)])), "2026-01-05");
    expect(hasCompositionDetail(v.composition)).toBe(false);
  });
  it("con bici, con passi o con recupero: compare", () => {
    expect(hasCompositionDetail(view(week(day("2026-01-05", [], { bikeKm: 30 })), "2026-01-05").composition)).toBe(true);
    expect(hasCompositionDetail(view(week(day("2026-01-05", [], { steps: 9000 })), "2026-01-05").composition)).toBe(true);
    expect(hasCompositionDetail(view(week(day("2026-01-05", [meal("a", 3000)]), day("2026-01-06")), "2026-01-06").composition)).toBe(true);
  });
});
