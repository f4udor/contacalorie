import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { dayTarget } from "./target";
import type { Activity, Day, Meal } from "./types";

const s = DEFAULT_SETTINGS;
const noAct: Activity = { steps: null, bikeKm: null, bikeKcalHealth: null };

function meal(id: string, kcal: number, isFree = false): Meal {
  return { id, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree };
}
function day(date: string, meals: Meal[], activity: Partial<Activity> = {}): Day {
  return { date, meals, activity: { ...noAct, ...activity } };
}

// Settimana 2026-01-05 (lun) … 2026-01-11 (dom)
const LUN = "2026-01-05";
const MAR = "2026-01-06";
const MER = "2026-01-07";
const GIO = "2026-01-08";

describe("dayTarget", () => {
  it("caso A: mercoledì con 9.000 passi, lun 1.750 e mar 1.800 → 2.175", () => {
    const days = [day(LUN, [meal("a", 1750)]), day(MAR, [meal("b", 1800)]), day(MER, [], { steps: 9000 })];
    const t = dayTarget(MER, days, s);
    expect(t.stepsBonus).toBe(75);
    expect(t.recovery).toBe(0);
    expect(t.total).toBe(2175);
  });

  it("caso B: saldo −425, recupero −106,25, obiettivo giovedì 1.994", () => {
    const days = [
      day(LUN, [meal("a", 1750)]),
      day(MAR, [meal("b", 1800)]),
      day(MER, [meal("c", 3250)], { steps: 9000 }),
      day(GIO, []),
    ];
    const t = dayTarget(GIO, days, s);
    expect(t.recovery).toBeCloseTo(-106.25, 10);
    expect(t.base).toBeCloseTo(1993.75, 10);
    expect(t.total).toBe(1994);
  });

  it("caso C: pasto libero → saldo positivo, obiettivo giovedì 2.100", () => {
    const days = [
      day(LUN, [meal("a", 1750)]),
      day(MAR, [meal("b", 1800)]),
      day(MER, [meal("col", 400), meal("pranzo", 2250, true), meal("cena", 600)], { steps: 9000 }),
      day(GIO, []),
    ];
    const t = dayTarget(GIO, days, s);
    expect(t.recovery).toBe(0);
    expect(t.total).toBe(2100);
  });

  it("caso D: lunedì 5.000 kcal → martedì limitato dalla soglia a 1.800", () => {
    const days = [day(LUN, [meal("a", 5000)]), day(MAR, [])];
    const t = dayTarget(MAR, days, s);
    expect(t.recovery).toBeCloseTo(-483.33, 2);
    expect(t.base).toBe(1800);
    expect(t.total).toBe(1800);
  });

  it("caso H: un giorno senza pasti non entra nel saldo", () => {
    // lun 2.500 (−400), mar vuoto: se martedì contasse (+2.100) il recupero sparirebbe.
    const days = [day(LUN, [meal("a", 2500)]), day(MAR, []), day(MER, [])];
    const t = dayTarget(MER, days, s);
    expect(t.recovery).toBeCloseTo(-80, 10);
    expect(t.total).toBe(2020);
  });

  it("il lunedì il recupero è sempre 0, anche con giorni della settimana precedente", () => {
    const days = [day("2026-01-04", [meal("a", 6000)]), day(LUN, [])];
    const t = dayTarget(LUN, days, s);
    expect(t.recovery).toBe(0);
    expect(t.total).toBe(2100);
  });

  it("i giorni di un'altra settimana non entrano nel saldo", () => {
    const days = [day("2026-01-04", [meal("a", 6000)]), day(MAR, [])];
    expect(dayTarget(MAR, days, s).recovery).toBe(0);
  });

  it("un saldo positivo non aumenta mai l'obiettivo", () => {
    const days = [day(LUN, [meal("a", 500)]), day(MAR, [meal("b", 500)]), day(MER, [])];
    const t = dayTarget(MER, days, s);
    expect(t.recovery).toBe(0);
    expect(t.base).toBe(2100);
    expect(t.total).toBe(2100);
  });

  it("la base non scende sotto la soglia; il bonus si somma sopra", () => {
    const days = [day(LUN, [meal("a", 5000)]), day(MAR, [], { bikeKm: 30 })];
    const t = dayTarget(MAR, days, s);
    expect(t.base).toBe(1800);
    expect(t.bikeBonus).toBe(405);
    expect(t.total).toBe(2205);
  });

  it("casi E e F: obiettivo con bici", () => {
    expect(dayTarget(LUN, [day(LUN, [], { bikeKm: 30 })], s).total).toBe(2505);
    expect(dayTarget(LUN, [day(LUN, [], { bikeKcalHealth: 800 })], s).total).toBe(2500);
  });

  it("il saldo include i bonus attività dei giorni precedenti", () => {
    // lun: 2100 + 405 − 2800 = −295 → mar: −295/6
    const days = [day(LUN, [meal("a", 2800)], { bikeKm: 30 }), day(MAR, [])];
    expect(dayTarget(MAR, days, s).recovery).toBeCloseTo(-295 / 6, 10);
  });

  it("se la soglia minima è sopra la base, la base resta la base", () => {
    const t = dayTarget(MAR, [day(LUN, [meal("a", 5000)])], { ...s, baseKcal: 1500, floorKcal: 1800 });
    expect(t.base).toBe(1500);
  });

  it("giorno non presente in weekDays: nessun bonus", () => {
    expect(dayTarget(MER, [], s).total).toBe(2100);
  });

  it("domenica: recupero diviso per 1", () => {
    const days = [day(LUN, [meal("a", 2300)]), day("2026-01-11", [])];
    expect(dayTarget("2026-01-11", days, s).recovery).toBe(-200);
  });
});
