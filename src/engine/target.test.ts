import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { dayTarget, weekBalanceBefore } from "./target";
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

  it("caso B: margine fermo a 300, saldo −775, recupero −100, obiettivo giovedì 2.000", () => {
    const days = [
      day(LUN, [meal("a", 1750)]),
      day(MAR, [meal("b", 1800)]),
      day(MER, [meal("c", 3250)], { steps: 9000 }),
      day(GIO, []),
    ];
    expect(weekBalanceBefore(MER, days, s)).toBe(300); // il margine di lun e mar non supera il tetto
    expect(weekBalanceBefore(GIO, days, s)).toBe(-775);
    const t = dayTarget(GIO, days, s);
    expect(t.recovery).toBe(-100);
    expect(t.base).toBe(2000);
    expect(t.total).toBe(2000);
  });

  it("caso C: pasto libero → kcalBudget 1.800, saldo 300 (tetto), obiettivo giovedì 2.100", () => {
    const days = [
      day(LUN, [meal("a", 1750)]),
      day(MAR, [meal("b", 1800)]),
      day(MER, [meal("col", 400), meal("pranzo", 2250, true), meal("cena", 600)], { steps: 9000 }),
      day(GIO, []),
    ];
    expect(weekBalanceBefore(GIO, days, s)).toBe(300);
    const t = dayTarget(GIO, days, s);
    expect(t.recovery).toBe(0);
    expect(t.total).toBe(2100);
  });

  it("caso D: lunedì 5.000 kcal → saldo −2.900, recupero −100, martedì 2.000", () => {
    const days = [day(LUN, [meal("a", 5000)]), day(MAR, [])];
    expect(weekBalanceBefore(MAR, days, s)).toBe(-2900);
    const t = dayTarget(MAR, days, s);
    expect(t.recovery).toBe(-100);
    expect(t.base).toBe(2000);
    expect(t.total).toBe(2000);
  });

  it("caso D con recoveryMaxPerDay 500: vale la soglia minima, martedì 1.800", () => {
    const days = [day(LUN, [meal("a", 5000)]), day(MAR, [])];
    const t = dayTarget(MAR, days, { ...s, recoveryMaxPerDay: 500 });
    expect(t.recovery).toBe(-500);
    expect(t.base).toBe(1800);
    expect(t.total).toBe(1800);
  });

  it("caso H: un giorno senza pasti non entra nel saldo", () => {
    // lun 2.500 (−400), mar vuoto: se martedì contasse (+2.100, tetto 300) il recupero sparirebbe.
    const days = [day(LUN, [meal("a", 2500)]), day(MAR, []), day(MER, [])];
    expect(weekBalanceBefore(MER, days, s)).toBe(-400);
    const t = dayTarget(MER, days, s);
    expect(t.recovery).toBe(-100);
    expect(t.total).toBe(2000);
  });

  it("caso M: debito di 11 kcal, sotto recoveryMin: nessun recupero", () => {
    const days = [day(LUN, [meal("a", 2111)]), day(MAR, [])];
    expect(weekBalanceBefore(MAR, days, s)).toBe(-11);
    const t = dayTarget(MAR, days, s);
    expect(t.recovery).toBe(0);
    expect(t.total).toBe(2100);
  });

  it("recoveryMin (50): un debito di 50 kcal si recupera (−50), uno di 49 no", () => {
    expect(dayTarget(MAR, [day(LUN, [meal("a", 2150)]), day(MAR, [])], s).recovery).toBe(-50);
    expect(dayTarget(MAR, [day(LUN, [meal("a", 2149)]), day(MAR, [])], s).recovery).toBe(0);
  });

  it("caso Z: 2.140 kcal → debito 40, nessun recupero (obiettivo 2.100); 2.150 kcal → debito 50, recupero −50 (obiettivo 2.050)", () => {
    const sotto = dayTarget(MAR, [day(LUN, [meal("a", 2140)]), day(MAR, [])], s);
    expect(sotto.recovery).toBe(0);
    expect(sotto.total).toBe(2100);
    const soglia = dayTarget(MAR, [day(LUN, [meal("a", 2150)]), day(MAR, [])], s);
    expect(soglia.recovery).toBe(-50);
    expect(soglia.total).toBe(2050);
  });

  it("caso N: il debito si estingue in più giorni (−100, −100, poi 2.100)", () => {
    const days = [day(LUN, [meal("a", 2300)]), day(MAR, [meal("b", 2000)]), day(MER, [meal("c", 2000)]), day(GIO, [])];
    expect(dayTarget(MAR, days, s).total).toBe(2000);
    expect(dayTarget(MER, days, s).total).toBe(2000);
    expect(weekBalanceBefore(GIO, days, s)).toBe(0);
    expect(dayTarget(GIO, days, s).total).toBe(2100);
  });

  it("caso O: il margine non supera 300 e assorbe lo sgarro successivo", () => {
    const days = [day(LUN, [meal("a", 1800)]), day(MAR, [meal("b", 1800)]), day(MER, [meal("c", 1800)]), day(GIO, [meal("d", 2500)]), day("2026-01-09", [])];
    expect(weekBalanceBefore(GIO, days, s)).toBe(300); // non 900
    expect(dayTarget(GIO, days, s).total).toBe(2100);
    expect(weekBalanceBefore("2026-01-09", days, s)).toBe(-100);
    expect(dayTarget("2026-01-09", days, s).total).toBe(2000);
  });

  it("caso P: dopo una domenica di sgarro il lunedì riparte da zero", () => {
    const days = [day("2026-01-11", [meal("a", 3000)]), day("2026-01-12", [])];
    expect(weekBalanceBefore("2026-01-12", days, s)).toBe(0);
    const t = dayTarget("2026-01-12", days, s);
    expect(t.recovery).toBe(0);
    expect(t.total).toBe(2100);
  });

  it("un saldo positivo non alza mai l'obiettivo, ma fa da cuscinetto", () => {
    const days = [day(LUN, [meal("a", 500)]), day(MAR, [meal("b", 3000)]), day(MER, [])];
    // lun +1.600 → 300; mar 2100−3000 = −900 → −600 → recupero −100
    expect(weekBalanceBefore(MER, days, s)).toBe(-600);
    const cushion = [day(LUN, [meal("a", 500)]), day(MAR, [meal("b", 2200)]), day(MER, [])];
    expect(weekBalanceBefore(MER, cushion, s)).toBe(200); // 300 − 100
    expect(dayTarget(MER, cushion, s).total).toBe(2100);
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
    const t = dayTarget(MAR, days, { ...s, recoveryMaxPerDay: 500 });
    expect(t.base).toBe(1800);
    expect(t.bikeBonus).toBe(405);
    expect(t.total).toBe(2205);
  });

  it("casi E e F: obiettivo con bici", () => {
    expect(dayTarget(LUN, [day(LUN, [], { bikeKm: 30 })], s).total).toBe(2505);
    expect(dayTarget(LUN, [day(LUN, [], { bikeKcalHealth: 800 })], s).total).toBe(2500);
  });

  it("il saldo include i bonus attività dei giorni precedenti", () => {
    // lun: 2100 + 405 − 2800 = −295 → debito 295, recupero al massimo 100
    const days = [day(LUN, [meal("a", 2800)], { bikeKm: 30 }), day(MAR, [])];
    expect(weekBalanceBefore(MAR, days, s)).toBe(-295);
    expect(dayTarget(MAR, days, s).recovery).toBe(-100);
  });

  it("se la soglia minima è sopra la base, la base resta la base", () => {
    const t = dayTarget(MAR, [day(LUN, [meal("a", 5000)])], { ...s, baseKcal: 1500, floorKcal: 1800 });
    expect(t.base).toBe(1500);
  });

  it("giorno non presente in weekDays: nessun bonus", () => {
    expect(dayTarget(MER, [], s).total).toBe(2100);
  });

  it("domenica: il recupero resta al massimo giornaliero", () => {
    const days = [day(LUN, [meal("a", 2300)]), day("2026-01-11", [])];
    expect(dayTarget("2026-01-11", days, s).recovery).toBe(-100);
  });
});
