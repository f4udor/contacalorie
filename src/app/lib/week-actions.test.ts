import { describe, expect, it } from "vitest";
import { createMemoryDataStore } from "@/data";
import type { ActivityRecord, MealRecord } from "@/data";
import { loadWeekData } from "./week-data";
import { buildTodayView } from "./today-view";
import { weekWeight, weightCard } from "./week-weight";
import { activityRows, defaultWeighInDate, deleteActivityValue, freeMealOfWeek, markFreeMeal, removeFreeMeal, saveManualBike, weekMeals, weighInsInWeek, withoutActivityValue } from "./week-actions";

const rec = (date: string, o: Partial<ActivityRecord> = {}): ActivityRecord => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, bikeKmManual: null, bikeKcalManual: null, ...o });
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
  const list = [
    rec("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeSource: "salute", bikeKmManual: 8 }),
    rec("2026-01-06", { steps: 5000, stepsSource: "manuale", bikeKcalHealth: 400, bikeSource: "salute" }),
    rec("2026-01-07", { bikeKmManual: 5, bikeKcalManual: 150 }),
  ];
  it("passi: solo un vecchio valore a mano si può eliminare", () => {
    const rows = activityRows("passi", list, WEEK);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({ steps: 8000, source: "salute", canDelete: false });
    expect(rows[1]).toMatchObject({ steps: 5000, source: "manuale", canDelete: true });
    expect(rows[2]).toMatchObject({ steps: null, source: null, canDelete: false });
  });
  it("bici: parte di Salute e parte a mano separate; si elimina solo la parte a mano", () => {
    const rows = activityRows("bici", list, WEEK);
    expect(rows[0]).toMatchObject({ km: 10, source: "salute", kmManual: 8, kcalManual: null, canDelete: true });
    expect(rows[1]).toMatchObject({ km: null, kcal: 400, source: "salute", kmManual: null, canDelete: false });
    expect(rows[2]).toMatchObject({ km: null, source: null, kmManual: 5, kcalManual: 150, canDelete: true });
    expect(rows[3]).toMatchObject({ km: null, kmManual: null, canDelete: false });
  });
});

describe("eliminazione dei valori", () => {
  it("si eliminano solo i valori a mano; il resto del giorno resta", () => {
    const r = rec("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeKcalHealth: 300, bikeSource: "salute", bikeKmManual: 8, bikeKcalManual: 200 });
    expect(withoutActivityValue(r, "passi")).toBeNull();
    expect(withoutActivityValue(r, "bici")).toEqual({ ...r, bikeKmManual: null, bikeKcalManual: null });
    expect(withoutActivityValue(rec("2026-01-05"), "bici")).toBeNull();
    expect(withoutActivityValue(rec("2026-01-05", { bikeKm: 10, bikeSource: "salute" }), "bici")).toBeNull();
  });
  it("sullo sportello: la parte a mano sparisce, quella di Salute resta", async () => {
    const store = createMemoryDataStore();
    await store.saveActivity(rec("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeSource: "salute", bikeKmManual: 8 }));
    expect(await deleteActivityValue(store, "2026-01-05", "passi")).toBe(false);
    expect((await store.getActivity("2026-01-05"))?.steps).toBe(8000);
    expect(await deleteActivityValue(store, "2026-01-05", "bici")).toBe(true);
    expect(await store.getActivity("2026-01-05")).toMatchObject({ steps: 8000, stepsSource: "salute", bikeKm: 10, bikeSource: "salute", bikeKmManual: null, bikeKcalManual: null });
    expect(await deleteActivityValue(store, "2026-01-05", "bici")).toBe(false);
    expect(await deleteActivityValue(store, "2026-01-06", "bici")).toBe(false);
  });
  it("salvare la parte a mano non tocca la parte di Salute né i passi", async () => {
    const store = createMemoryDataStore();
    await store.saveActivity(rec("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeSource: "salute" }));
    await saveManualBike(store, "2026-01-05", { km: 8, kcal: null });
    expect(await store.getActivity("2026-01-05")).toMatchObject({ steps: 8000, bikeKm: 10, bikeSource: "salute", bikeKmManual: 8, bikeKcalManual: null });
    await saveManualBike(store, "2026-01-05", { km: 9, kcal: 250 });
    expect(await store.getActivity("2026-01-05")).toMatchObject({ bikeKm: 10, bikeKmManual: 9, bikeKcalManual: 250 });
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

describe("dopo una modifica i numeri si ricalcolano", () => {
  const fmt = (n: number) => String(n);

  it("pesata eliminata: la scheda Peso torna a «Nessuna pesata»", async () => {
    const store = createMemoryDataStore();
    await store.saveWeighIn({ date: "2026-01-07", weightKg: 91.4 });
    const card = async () => {
      const weighIns = await store.listWeighIns();
      return weightCard(weekWeight({ monday: WEEK[0], sunday: WEEK[6], weighIns }), fmt, fmt);
    };
    expect((await card()).value).toBe("91.4 kg");
    await store.deleteWeighIn("2026-01-07");
    expect(await card()).toEqual({ value: "Nessuna pesata" });
  });

  it("scheda Peso: con pesate mostra kg e differenza, senza dice «Nessuna pesata»", () => {
    expect(weightCard(null, fmt, fmt)).toEqual({ value: "Nessuna pesata" });
    const w = weekWeight({ monday: WEEK[0], sunday: WEEK[6], weighIns: [{ date: "2026-01-02", weightKg: 92 }, { date: "2026-01-07", weightKg: 91.4 }], targetWeightKg: 82 });
    expect(weightCard(w, fmt, fmt)).toEqual({ value: "91.4 kg", hint: "-0.6 kg dalla pesata precedente", tone: "ok" });
  });

  it("passi a mano eliminati: l'obiettivo di Oggi perde il bonus passi", async () => {
    const store = createMemoryDataStore();
    await store.saveActivity(rec("2026-01-08", { steps: 9000, stepsSource: "manuale" }));
    const target = async () => {
      const data = await loadWeekData(store, "2026-01-08");
      return buildTodayView({ date: "2026-01-08", days: data.days, settings: data.settings, weightKg: 100 });
    };
    expect((await target()).target).toBe(2175);
    await deleteActivityValue(store, "2026-01-08", "passi");
    expect((await target()).target).toBe(2100);
  });

  it("pasto libero tolto: il budget del giorno conta il pasto per intero", async () => {
    const store = createMemoryDataStore();
    await store.saveMeal(dish("p", "2026-01-08", "pranzo", 2250, true));
    const remaining = async () => {
      const data = await loadWeekData(store, "2026-01-08");
      return buildTodayView({ date: "2026-01-08", days: data.days, settings: data.settings, weightKg: 100 }).remaining;
    };
    expect(await remaining()).toBe(2100 - 800);
    await removeFreeMeal(store, { date: "2026-01-08", slot: "pranzo" });
    expect(await remaining()).toBe(2100 - 2250);
  });
});
