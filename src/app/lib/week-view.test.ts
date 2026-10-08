import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/engine";
import type { Activity, Day, Meal } from "@/engine";
import { buildWeekView } from "./week-view";

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
