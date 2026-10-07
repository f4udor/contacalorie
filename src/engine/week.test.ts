import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { weekSummary } from "./week";
import type { Activity, Day, Meal } from "./types";

const s = DEFAULT_SETTINGS;
const noAct: Activity = { steps: null, bikeKm: null, bikeKcalHealth: null };

function meal(id: string, kcal: number, extra: Partial<Meal> = {}): Meal {
  return { id, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false, ...extra };
}
function day(date: string, meals: Meal[], activity: Partial<Activity> = {}, challengeDone?: boolean): Day {
  return { date, meals, activity: { ...noAct, ...activity }, challengeDone };
}

const LUN = "2026-01-05";
const MAR = "2026-01-06";
const MER = "2026-01-07";

describe("weekSummary: settimana vuota", () => {
  it("nessun errore, valori assenti (null) e non zero", () => {
    const w = weekSummary(MER, [], s);
    expect(w.days).toHaveLength(7);
    expect(w.days[0].date).toBe(LUN);
    expect(w.days[6].date).toBe("2026-01-11");
    expect(w.balance).toBeNull();
    expect(w.avgKcal).toBeNull();
    expect(w.avgNutrients).toBeNull();
    expect(w.totalKm).toBeNull();
    expect(w.avgSteps).toBeNull();
    expect(w.freeMealUsed).toBe(false);
    expect(w.challengeDaysDone).toBe(0);
    expect(w.days.every((d) => d.kcalEaten === 0 && !d.hasMeals && d.target === 2100)).toBe(true);
  });
});

describe("weekSummary: settimana con dati", () => {
  const days = [
    day(LUN, [meal("a", 1750, { protein: 100, carbs: 200, fat: 60, fiber: 20, salt: 4 })], { steps: 8000, bikeKm: 20 }, true),
    day(MAR, [meal("b", 1900, { protein: 120, carbs: 220, fat: 80, fiber: 30, salt: 6 })], { steps: 0 }, true),
    day(MER, [meal("c", 2250, { isFree: true }), meal("d", 500)], { steps: 10000, bikeKm: 10 }),
    day("2026-01-08", []), // senza pasti
    day("2026-01-12", [meal("fuori", 9999)]), // altra settimana
  ];
  const w = weekSummary(MER, days, s);

  it("kcal e obiettivo di ogni giorno", () => {
    expect(w.days[0]).toMatchObject({ date: LUN, kcalEaten: 1750, kcalBudget: 1750, hasMeals: true });
    expect(w.days[2]).toMatchObject({ kcalEaten: 2750, kcalBudget: 1300, hasMeals: true });
    expect(w.days[3].hasMeals).toBe(false);
  });

  it("obiettivo di ogni giorno (con bonus di quel giorno)", () => {
    // lun: 2100 + bici 20×27×0,5=270 + passi (2000×0,05×0,5=50) = 2420
    expect(w.days[0].target).toBe(2420);
    // mar: saldo lun = 2420 − 1750 = +670 → nessun recupero → 2100
    expect(w.days[1].target).toBe(2100);
  });

  it("saldo sui giorni con pasti", () => {
    // lun +670; mar 2100−1900 = +200; mer 2100+135+100−1300 = +1035
    expect(w.balance).toBe(670 + 200 + 1035);
  });

  it("media kcal reali sui giorni con pasti (non i 7 giorni)", () => {
    expect(w.avgKcal).toBeCloseTo((1750 + 1900 + 2750) / 3, 10);
  });

  it("medie dei nutrienti sui giorni con pasti", () => {
    expect(w.avgNutrients).toEqual({ protein: 220 / 3, carbs: 420 / 3, fat: 140 / 3, fiber: 50 / 3, salt: 10 / 3 });
  });

  it("km totali, passi medi solo sui giorni con passi, pasto libero, sfida", () => {
    expect(w.totalKm).toBe(30);
    expect(w.avgSteps).toBe(9000); // 8000 e 10000; il giorno con 0 passi non conta
    expect(w.freeMealUsed).toBe(true);
    expect(w.challengeDaysDone).toBe(2);
  });
});

describe("weekSummary: casi particolari", () => {
  it("settimana con solo pasti e senza attività: km e passi assenti", () => {
    const w = weekSummary(LUN, [day(LUN, [meal("a", 2000)])], s);
    expect(w.totalKm).toBeNull();
    expect(w.avgSteps).toBeNull();
    expect(w.balance).toBe(100);
  });

  it("km pari a 0 registrati sono un dato (totale 0)", () => {
    expect(weekSummary(LUN, [day(LUN, [], { bikeKm: 0 })], s).totalKm).toBe(0);
  });

  it("nessun pasto libero se non usato", () => {
    expect(weekSummary(LUN, [day(LUN, [meal("a", 2000)])], s).freeMealUsed).toBe(false);
  });
});
