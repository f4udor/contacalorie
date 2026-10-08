import { describe, expect, it } from "vitest";
import { createMemoryDataStore } from "@/data";
import type { ActivityRecord, MealRecord } from "@/data";
import { activityRows, defaultWeighInDate, deleteActivityValue, freeMealOfWeek, markFreeMeal, removeFreeMeal, weekMeals, weighInsInWeek, withoutActivityValue } from "./week-actions";

const rec = (date: string, o: Partial<ActivityRecord> = {}): ActivityRecord => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, ...o });
const dish = (id: string, date: string, slot: MealRecord["slot"], kcal: number, isFree = false): MealRecord => ({
  id, date, slot, name: id, quantity: null, kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree, originalText: null,
});
const WEEK = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-11"];

describe("pesate della settimana", () => {
  it("solo quelle della settimana, dalla più recente", () => {
    const w = [
      { date: "2026-01-02", weightKg: 90 },
      { date: "2026-01-06", weightKg: 91 },
      { date: "2026-01-09", weightKg: 90.5 },
      { date: "2026-01-12", weightKg: 89 },
    ];
    expect(weighInsInWeek(w, WEEK[0], WEEK[6]).map((x) => x.date)).toEqual(["2026-01-09", "2026-01-06"]);
    expect(weighInsInWeek([], WEEK[0], WEEK[6])).toEqual([]);
  });
  it("giorno proposto per una nuova pesata", () => {
    expect(defaultWeighInDate(WEEK, "2026-01-08")).toBe("2026-01-08");
    expect(defaultWeighInDate(WEEK, "2026-01-20")).toBe("2026-01-11");
    expect(defaultWeighInDate(WEEK, "2025-12-30")).toBe("2026-01-05");
  });
});

describe("righe di passi e bici", () => {
  const list = [rec("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeSource: "manuale" }), rec("2026-01-06", { steps: 5000, stepsSource: "manuale", bikeKcalHealth: 400, bikeSource: "salute" })];
  it("passi: la fonte decide se si può eliminare", () => {
    const rows = activityRows("passi", list, WEEK);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({ steps: 8000, source: "salute", canDelete: false });
    expect(rows[1]).toMatchObject({ steps: 5000, source: "manuale", canDelete: true });
    expect(rows[2]).toMatchObject({ steps: null, source: null, canDelete: false });
  });
  it("bici: km o kcal, con la fonte", () => {
    const rows = activityRows("bici", list, WEEK);
    expect(rows[0]).toMatchObject({ km: 10, source: "manuale", canDelete: true });
    expect(rows[1]).toMatchObject({ km: null, kcal: 400, source: "salute", canDelete: false });
  });
});

describe("eliminazione dei valori", () => {
  it("si eliminano solo i valori a mano; l'altro valore del giorno resta", () => {
    const r = rec("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeKcalHealth: 300, bikeSource: "manuale" });
    expect(withoutActivityValue(r, "passi")).toBeNull();
    expect(withoutActivityValue(r, "bici")).toEqual({ ...r, bikeKm: null, bikeKcalHealth: null, bikeSource: null });
    expect(withoutActivityValue(rec("2026-01-05"), "bici")).toBeNull();
  });
  it("sullo sportello: il valore a mano sparisce, quello da Salute resta, il giorno resta libero per un nuovo invio", async () => {
    const store = createMemoryDataStore();
    await store.saveActivity(rec("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeSource: "manuale" }));
    expect(await deleteActivityValue(store, "2026-01-05", "passi")).toBe(false);
    expect((await store.getActivity("2026-01-05"))?.steps).toBe(8000);
    expect(await deleteActivityValue(store, "2026-01-05", "bici")).toBe(true);
    expect(await store.getActivity("2026-01-05")).toMatchObject({ steps: 8000, stepsSource: "salute", bikeKm: null, bikeSource: null });
    expect(await deleteActivityValue(store, "2026-01-06", "bici")).toBe(false);
  });
});

describe("pasto libero della settimana", () => {
  const meals = [dish("a", "2026-01-07", "pranzo", 700, true), dish("b", "2026-01-07", "pranzo", 600, true), dish("c", "2026-01-06", "cena", 500), dish("d", "2026-01-07", "colazione", 300)];
  it("pasti in ordine di data e fascia, con le kcal reali", () => {
    expect(weekMeals(meals).map((m) => [m.date, m.slot, m.kcal, m.isFree])).toEqual([
      ["2026-01-06", "cena", 500, false],
      ["2026-01-07", "colazione", 300, false],
      ["2026-01-07", "pranzo", 1300, true],
    ]);
  });
  it("trova il pasto libero o nessuno", () => {
    expect(freeMealOfWeek(meals)).toMatchObject({ date: "2026-01-07", slot: "pranzo", kcal: 1300 });
    expect(freeMealOfWeek(meals.map((m) => ({ ...m, isFree: false })))).toBeNull();
  });
  it("toglierlo e rimetterlo: i piatti restano, il segno cambia su tutto il pasto", async () => {
    const store = createMemoryDataStore();
    for (const m of meals) await store.saveMeal(m);
    await removeFreeMeal(store, { date: "2026-01-07", slot: "pranzo" });
    let saved = await store.listMealsBetween(WEEK[0], WEEK[6]);
    expect(saved).toHaveLength(4);
    expect(saved.some((m) => m.isFree)).toBe(false);
    expect(await markFreeMeal(store, weekMeals(saved), { date: "2026-01-06", slot: "cena" })).toBe(true);
    saved = await store.listMealsBetween(WEEK[0], WEEK[6]);
    expect(saved.filter((m) => m.isFree).map((m) => m.id)).toEqual(["c"]);
  });
  it("non si segna un secondo pasto libero nella stessa settimana", async () => {
    const store = createMemoryDataStore();
    for (const m of meals) await store.saveMeal(m);
    expect(await markFreeMeal(store, weekMeals(meals), { date: "2026-01-06", slot: "cena" })).toBe(false);
    expect((await store.listMealsBetween(WEEK[0], WEEK[6])).filter((m) => m.isFree)).toHaveLength(2);
  });
});
