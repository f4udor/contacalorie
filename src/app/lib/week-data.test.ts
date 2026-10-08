import { describe, expect, it } from "vitest";
import { createMemoryDataStore } from "@/data";
import type { MealRecord } from "@/data";
import { loadWeekData } from "./week-data";

function meal(id: string, date: string, kcal: number): MealRecord {
  return { id, date, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false, originalText: null };
}

describe("loadWeekData", () => {
  it("restituisce sette giorni da lunedì a domenica, anche senza dati", async () => {
    const w = await loadWeekData(createMemoryDataStore(), "2026-01-08");
    expect(w.days.map((d) => d.date)).toEqual([
      "2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-11",
    ]);
    expect(w.days.every((d) => d.meals.length === 0 && d.activity.steps === null)).toBe(true);
    expect(w.settings.baseKcal).toBe(2100);
  });

  it("assegna pasti e attività al giorno giusto e ignora altre settimane", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(meal("a", "2026-01-06", 500));
    await s.saveMeal(meal("fuori", "2026-01-12", 900));
    await s.saveActivity({ date: "2026-01-07", steps: 9000, stepsSource: "manuale", bikeKm: 12, bikeKcalHealth: null, bikeSource: "salute", bikeKmManual: 5, bikeKcalManual: null });
    const w = await loadWeekData(s, "2026-01-11");
    expect(w.days[1].meals).toHaveLength(1);
    expect(w.days[2].activity).toEqual({ steps: 9000, bikeKm: 12, bikeKcalHealth: null, bikeKmManual: 5, bikeKcalManual: null });
    expect(w.days.flatMap((d) => d.meals).map((m) => m.id)).toEqual(["a"]);
  });

  it("unisce le impostazioni dell'utente ai default", async () => {
    const s = createMemoryDataStore();
    await s.saveSettings({ baseKcal: 2000, weightKg: 90 });
    const w = await loadWeekData(s, "2026-01-08");
    expect(w.settings.baseKcal).toBe(2000);
    expect(w.settings.floorKcal).toBe(1800);
    expect(w.userSettings.weightKg).toBe(90);
  });
});
