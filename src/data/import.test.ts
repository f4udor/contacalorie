import { describe, expect, it } from "vitest";
import { createMemoryDataStore } from "./memory";
import { importLocalData, isEmptyData, mergeActivity, normalizeFreeFlags, summarize } from "./import";
import type { DataStore } from "./store";
import type { ActivityRecord, MealRecord, StoredData } from "./types";

const dish = (id: string, date: string, slot: MealRecord["slot"] = "pranzo", isFree = false, kcal = 500): MealRecord => ({
  id, date, slot, name: id, quantity: null, kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree, originalText: null,
});
const act = (date: string, o: Partial<ActivityRecord> = {}): ActivityRecord => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, ...o });
const data = (o: Partial<StoredData> = {}): StoredData => ({ version: 1, settings: {}, meals: [], activity: [], weighIns: [], favoriteDishes: [], favoriteMeals: [], ...o });

async function filled(d: StoredData): Promise<DataStore> {
  const s = createMemoryDataStore();
  for (const m of d.meals) await s.saveMeal(m);
  for (const a of d.activity) await s.saveActivity(a);
  for (const w of d.weighIns) await s.saveWeighIn(w);
  for (const f of d.favoriteDishes) await s.saveFavoriteDish(f);
  for (const f of d.favoriteMeals) await s.saveFavoriteMeal(f);
  if (Object.keys(d.settings).length) await s.saveSettings(d.settings);
  return s;
}

describe("summarize / isEmptyData", () => {
  it("conta giorni diversi, piatti e pesate", () => {
    const d = data({
      meals: [dish("a", "2026-01-05"), dish("b", "2026-01-05"), dish("c", "2026-01-06")],
      activity: [act("2026-01-06", { steps: 1 }), act("2026-01-07", { steps: 2 })],
      weighIns: [{ date: "2026-01-05", weightKg: 90 }],
    });
    expect(summarize(d)).toEqual({ days: 3, dishes: 3, weighIns: 1 });
  });
  it("archivio vuoto", () => {
    expect(isEmptyData(data())).toBe(true);
    expect(summarize(data())).toEqual({ days: 0, dishes: 0, weighIns: 0 });
    expect(isEmptyData(data({ settings: { weightKg: 90 } }))).toBe(false);
    expect(isEmptyData(data({ meals: [dish("a", "2026-01-05")] }))).toBe(false);
  });
});

describe("normalizeFreeFlags (pasti salvati prima dei pasti composti)", () => {
  it("un pasto con almeno un piatto libero diventa libero per intero; gli altri pasti non cambiano", () => {
    const { meals, changedMeals } = normalizeFreeFlags([
      dish("a", "2026-01-05", "pranzo", true),
      dish("b", "2026-01-05", "pranzo", false),
      dish("c", "2026-01-05", "cena", false),
      dish("d", "2026-01-06", "pranzo", false),
    ]);
    expect(meals.map((m) => m.isFree)).toEqual([true, true, false, false]);
    expect(changedMeals).toBe(1);
  });
  it("un piatto per voce, già coerente: nessun cambiamento", () => {
    const { meals, changedMeals } = normalizeFreeFlags([dish("a", "2026-01-05", "pranzo", true), dish("b", "2026-01-05", "cena")]);
    expect(changedMeals).toBe(0);
    expect(meals.map((m) => m.isFree)).toEqual([true, false]);
  });
});

describe("importLocalData: preferiti", () => {
  const body = { name: "Pasta al pesto", quantity: "80 g", kcal: 480, protein: 15, carbs: 70, fat: 16, fiber: 4, salt: 1.3 };
  const local = data({ favoriteDishes: [{ id: "f1", ...body }], favoriteMeals: [{ id: "p1", name: "Cena leggera", slot: "cena", dishes: [body, { ...body, name: "Insalata", quantity: null, kcal: 60 }] }] });

  it("porta i preferiti, senza doppioni se ripetuta o con un secondo dispositivo", async () => {
    const remote = createMemoryDataStore();
    const first = await importLocalData(local, remote);
    expect(first).toMatchObject({ addedFavorites: 2, alreadyThere: 0 });
    const again = await importLocalData(local, remote);
    expect(again).toMatchObject({ addedFavorites: 0, alreadyThere: 2 });
    const second = await importLocalData(data({ favoriteDishes: [{ id: "f2", ...body, name: "Altro" }] }), remote);
    expect(second.addedFavorites).toBe(1);
    const all = await remote.exportAll();
    expect(all.favoriteDishes.map((f) => f.id)).toEqual(["f1", "f2"]);
    expect(all.favoriteMeals).toHaveLength(1);
  });

  it("un archivio con soli preferiti non è vuoto", () => {
    expect(isEmptyData(local)).toBe(false);
  });
});

describe("importLocalData", () => {
  const local = data({
    settings: { weightKg: 92, baseKcal: 2000 },
    meals: [dish("a", "2026-01-05"), dish("b", "2026-01-05", "cena", true, 900)],
    activity: [act("2026-01-05", { steps: 9000, stepsSource: "manuale" })],
    weighIns: [{ date: "2026-01-05", weightKg: 92 }],
  });

  it("in un account vuoto porta tutto", async () => {
    const remote = createMemoryDataStore();
    const r = await importLocalData(local, remote);
    expect(r).toMatchObject({ addedDishes: 2, addedWeighIns: 1, addedActivityDays: 1, alreadyThere: 0 });
    const all = await remote.exportAll();
    expect(all.meals.map((m) => m.id).sort()).toEqual(["a", "b"]);
    expect(all.settings).toEqual({ weightKg: 92, baseKcal: 2000 });
    expect(all.weighIns).toEqual([{ date: "2026-01-05", weightKg: 92 }]);
  });

  it("ripetuta non crea doppioni né riscrive nulla", async () => {
    const remote = createMemoryDataStore();
    await importLocalData(local, remote);
    const again = await importLocalData(local, remote);
    expect(again).toMatchObject({ addedDishes: 0, addedWeighIns: 0, addedActivityDays: 0, alreadyThere: 4 });
    const all = await remote.exportAll();
    expect(all.meals).toHaveLength(2);
    expect(all.activity).toHaveLength(1);
    expect(all.weighIns).toHaveLength(1);
  });

  it("da un secondo dispositivo con dati diversi le due raccolte si uniscono", async () => {
    const remote = createMemoryDataStore();
    await importLocalData(local, remote);
    const second = data({
      settings: { weightKg: 80, heightCm: 178 },
      meals: [dish("a", "2026-01-05"), dish("z", "2026-01-06")],
      activity: [act("2026-01-05", { steps: 100 }), act("2026-01-06", { bikeKm: 10, bikeSource: "manuale" })],
      weighIns: [{ date: "2026-01-05", weightKg: 80 }, { date: "2026-01-06", weightKg: 91 }],
    });
    const r = await importLocalData(second, remote);
    expect(r).toMatchObject({ addedDishes: 1, addedWeighIns: 1, addedActivityDays: 1 });
    const all = await remote.exportAll();
    expect(all.meals.map((m) => m.id).sort()).toEqual(["a", "b", "z"]);
    // già nell'account: vince quello dell'account
    expect(all.weighIns.find((w) => w.date === "2026-01-05")?.weightKg).toBe(92);
    expect(all.activity.find((a) => a.date === "2026-01-05")?.steps).toBe(9000);
    expect(all.activity.find((a) => a.date === "2026-01-06")?.bikeKm).toBe(10);
    // impostazioni: restano quelle dell'account, si completano le mancanti
    expect(all.settings).toEqual({ weightKg: 92, baseKcal: 2000, heightCm: 178 });
  });

  it("non cancella niente dall'account", async () => {
    const remote = await filled(data({ meals: [dish("solo-account", "2026-02-01")], weighIns: [{ date: "2026-02-01", weightKg: 88 }] }));
    await importLocalData(local, remote);
    const all = await remote.exportAll();
    expect(all.meals.map((m) => m.id)).toContain("solo-account");
    expect(all.weighIns.map((w) => w.date)).toContain("2026-02-01");
  });

  it("i pasti vecchi (un piatto per voce) diventano pasti di un solo piatto e un pasto con un piatto libero lo diventa per intero", async () => {
    const remote = createMemoryDataStore();
    const old = data({ meals: [dish("p1", "2026-01-05", "pranzo", true, 900), dish("p2", "2026-01-05", "pranzo", false, 300), dish("c1", "2026-01-05", "cena", false, 600)] });
    const r = await importLocalData(old, remote);
    expect(r.normalizedFreeMeals).toBe(1);
    const all = await remote.exportAll();
    expect(Object.fromEntries(all.meals.map((m) => [m.id, m.isFree]))).toEqual({ p1: true, p2: true, c1: false });
  });

  it("un errore a metà non cancella nulla e rilanciandola si completa senza doppioni", async () => {
    const remote = createMemoryDataStore();
    let calls = 0;
    const flaky: DataStore = Object.assign(Object.create(remote), {
      saveMeal: async (m: MealRecord) => {
        if (++calls === 2) throw new Error("rete");
        return remote.saveMeal(m);
      },
      exportAll: () => remote.exportAll(),
    });
    await expect(importLocalData(local, flaky)).rejects.toThrow("rete");
    await importLocalData(local, remote);
    const all = await remote.exportAll();
    expect(all.meals.map((m) => m.id).sort()).toEqual(["a", "b"]);
  });
});

describe("mergeActivity", () => {
  it("per ogni gruppo vince il valore già nell'account, se c'è", () => {
    const remote = act("2026-01-05", { steps: 8000, stepsSource: "salute" });
    const local = act("2026-01-05", { steps: 1, stepsSource: "manuale", bikeKm: 20, bikeSource: "manuale" });
    expect(mergeActivity(remote, local)).toEqual({ date: "2026-01-05", steps: 8000, stepsSource: "salute", bikeKm: 20, bikeKcalHealth: null, bikeSource: "manuale" });
  });
});
