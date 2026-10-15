import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/engine";
import type { Activity, Day, Meal } from "@/engine";
import { balanceCaption, buildWeekView } from "./week-view";

const s = DEFAULT_SETTINGS;
const noAct: Activity = { steps: null, bikeKm: null, bikeKcalHealth: null };
const meal = (id: string, kcal: number, extra: Partial<Meal> = {}): Meal => ({ id, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false, ...extra });
const day = (date: string, meals: Meal[] = [], activity: Partial<Activity> = {}): Day => ({ date, meals, activity: { ...noAct, ...activity } });

describe("buildWeekView", () => {
  it("settimana vuota: sette barre vuote, nessun valore, isEmpty", () => {
    const v = buildWeekView({ date: "2026-01-08", days: [], settings: s });
    expect(v.bars).toHaveLength(7);
    expect(v.bars.every((b) => !b.hasMeals && b.eaten === 0 && b.color === "neutro" && b.barRatio === 0)).toBe(true);
    expect(v.isEmpty).toBe(true);
    expect(v.summary.balance).toBeNull();
  });

  it("caso B in settimana: obiettivi e colori per giorno", () => {
    const days = [
      day("2026-01-05", [meal("a", 1750)]),
      day("2026-01-06", [meal("b", 1800)]),
      day("2026-01-07", [meal("c", 3250)], { steps: 9000 }),
      day("2026-01-08", [meal("d", 1900)]),
    ];
    const v = buildWeekView({ date: "2026-01-08", days, settings: s });
    expect(v.bars.map((b) => b.target).slice(0, 4)).toEqual([2100, 2100, 2175, 2000]);
    expect(v.bars.map((b) => b.color).slice(0, 4)).toEqual(["accento", "accento", "rosso", "verde"]);
    expect(v.summary.balance).toBe(-575); // 300, 300, −775, −575 (margine limitato a 300)
    expect(v.isEmpty).toBe(false);
  });

  it("con `today` i giorni dopo oggi mostrano l'anteprima: debito di 250 → 2.000, 2.000, 2.050, 2.100", () => {
    const days = [day("2026-01-05", [meal("a", 2350)]), day("2026-01-06", [meal("b", 2100)]), day("2026-01-07", [meal("c", 2100)])];
    const v = buildWeekView({ date: "2026-01-08", days, settings: s, today: "2026-01-08" });
    expect(v.bars.map((b) => b.target).slice(3)).toEqual([2000, 2000, 2050, 2100]);
  });

  it("le altezze usano una scala comune e restano entro 1", () => {
    const days = [day("2026-01-05", [meal("a", 3000)])];
    const v = buildWeekView({ date: "2026-01-05", days, settings: s });
    expect(v.bars[0].barRatio).toBeGreaterThan(v.bars[0].targetRatio);
    expect(Math.max(...v.bars.map((b) => Math.max(b.barRatio, b.targetRatio)))).toBeLessThanOrEqual(1);
  });

  it("pasto libero: il colore usa il budget, l'altezza le kcal reali", () => {
    const days = [day("2026-01-05", [meal("a", 2250, { isFree: true })])];
    const b = buildWeekView({ date: "2026-01-05", days, settings: s }).bars[0];
    expect(b.eaten).toBe(2250);
    expect(b.color).toBe("accento");
  });

  it("solo attività senza pasti: la settimana non è vuota", () => {
    const v = buildWeekView({ date: "2026-01-05", days: [day("2026-01-06", [], { bikeKm: 10 })], settings: s });
    expect(v.isEmpty).toBe(false);
    expect(v.summary.totalKm).toBe(10);
  });
});

describe("linea della media kcal (T5b.6)", () => {
  const eat = (date: string, kcal: number) => day(date, [meal(`m-${date}`, kcal)]);
  it("la media è quella dei giorni conclusi e la linea sta sulla stessa scala delle barre", () => {
    const days = [eat("2026-01-05", 2000), eat("2026-01-07", 2200), eat("2026-01-08", 600)];
    const v = buildWeekView({ date: "2026-01-08", days, settings: s, today: "2026-01-08" });
    expect(v.summary.avgKcal).toBe(2100);
    const top = Math.max(...v.bars.map((b) => Math.max(b.barRatio, b.targetRatio)));
    expect(v.avgRatio).not.toBeNull();
    expect(v.avgRatio as number).toBeGreaterThan(0);
    expect(v.avgRatio as number).toBeLessThanOrEqual(1);
    expect(top).toBeLessThanOrEqual(1);
    // 2.100 sulla stessa scala di una barra da 2.100: stessa altezza.
    const bar2100 = buildWeekView({ date: "2026-01-08", days: [eat("2026-01-05", 2100)], settings: s, today: "2026-01-20" });
    expect(bar2100.avgRatio).toBeCloseTo(bar2100.bars[0].barRatio, 10);
  });
  it("senza media (solo oggi con pasti) la linea non c'è", () => {
    const v = buildWeekView({ date: "2026-01-05", days: [eat("2026-01-05", 800)], settings: s, today: "2026-01-05" });
    expect(v.summary.avgKcal).toBeNull();
    expect(v.avgRatio).toBeNull();
  });
  it("una media più alta di ogni barra e di ogni obiettivo non esce dal grafico", () => {
    const days = [eat("2026-01-05", 2000)];
    const v = buildWeekView({ date: "2026-01-05", days, settings: s, today: "2026-01-20" });
    expect(v.avgRatio as number).toBeLessThanOrEqual(1);
  });

  it("solo i pasti di oggi: il saldo è assente (trattino) ma la settimana non è vuota", () => {
    const v = buildWeekView({ date: "2026-01-05", days: [day("2026-01-05", [meal("a", 600)])], settings: s, today: "2026-01-05" });
    expect(v.summary.balance).toBeNull();
    expect(v.isEmpty).toBe(false);
  });
});

describe("testo sotto il Saldo (T8.4, BRIEF §3.3, casi AJ-AM)", () => {
  const week = (...overrides: Day[]): Day[] => {
    const dates = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-11"];
    return dates.map((d) => overrides.find((o) => o.date === d) ?? day(d));
  };
  const balance = (days: Day[], today: string) => buildWeekView({ date: "2026-01-05", days, settings: { ...s, baseKcal: 2100, creditCap: 300 }, today }).summary.balance;

  it("caso AJ: lunedì 1.900, oggi martedì → +200, «di margine»", () => {
    const b = balance(week(day("2026-01-05", [meal("a", 1900)]), day("2026-01-06", [meal("b", 600)])), "2026-01-06");
    expect(b).toBe(200);
    expect(balanceCaption(b)).toBe("di margine");
  });
  it("caso AK: oggi è lunedì → trattino, nessun testo", () => {
    const b = balance(week(day("2026-01-05", [meal("a", 600)])), "2026-01-05");
    expect(b).toBeNull();
    expect(balanceCaption(b)).toBeNull();
  });
  it("caso AL: lunedì 2.500, oggi martedì senza pasti → −400, «da recuperare»", () => {
    const b = balance(week(day("2026-01-05", [meal("a", 2500)])), "2026-01-06");
    expect(b).toBe(-400);
    expect(balanceCaption(b)).toBe("da recuperare");
  });
  it("caso AM: settimana passata, +300 al tetto → «di margine»", () => {
    const b = balance(week(day("2026-01-05", [meal("a", 1900)]), day("2026-01-11", [meal("b", 2000)])), "2026-01-20");
    expect(b).toBe(300);
    expect(balanceCaption(b)).toBe("di margine");
  });
  it("saldo zero: «in pari»", () => {
    expect(balanceCaption(0)).toBe("in pari");
  });
});
