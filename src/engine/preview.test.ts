import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { previewDayTarget } from "./preview";
import { dayTarget } from "./target";
import type { Activity, Day, Meal } from "./types";

const s = DEFAULT_SETTINGS;
const noAct: Activity = { steps: null, bikeKm: null, bikeKcalHealth: null };
const meal = (id: string, kcal: number): Meal => ({ id, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false });
const day = (date: string, meals: Meal[], activity: Partial<Activity> = {}): Day => ({ date, meals, activity: { ...noAct, ...activity } });

// Settimana 2026-01-05 (lun) … 2026-01-11 (dom)
const LUN = "2026-01-05";
const MAR = "2026-01-06";
const MER = "2026-01-07";
const GIO = "2026-01-08";
const VEN = "2026-01-09";
const SAB = "2026-01-10";
const DOM = "2026-01-11";

describe("anteprima dei giorni futuri", () => {
  // Oggi è giovedì, nessun pasto; lun 2.350 → saldo −250 dai giorni precedenti.
  const days = [day(LUN, [meal("a", 2350)]), day(MAR, [meal("b", 2100)]), day(MER, [meal("c", 2100)])];

  it("caso Q: giovedì 2.000, venerdì 2.000, sabato 2.050, domenica 2.100 (il debito non si ripete)", () => {
    expect(previewDayTarget(GIO, GIO, days, s).total).toBe(2000);
    expect(previewDayTarget(VEN, GIO, days, s).total).toBe(2000);
    expect(previewDayTarget(SAB, GIO, days, s).total).toBe(2050);
    expect(previewDayTarget(DOM, GIO, days, s).total).toBe(2100);
  });

  it("caso R: oggi giovedì, saldo 0, mangiate 2.111 su 2.100 → venerdì 2.100 (debito 11 sotto recoveryMin)", () => {
    const d = [day(GIO, [meal("x", 2111)])];
    expect(previewDayTarget(VEN, GIO, d, s).total).toBe(2100);
  });

  it("oggi con kcal reali sopra l'obiettivo pesano sul futuro; sotto l'obiettivo contano come se lo raggiungessero", () => {
    expect(previewDayTarget(VEN, GIO, [day(GIO, [meal("x", 2500)])], s).total).toBe(2000); // −400 → −100
    expect(previewDayTarget(VEN, GIO, [day(GIO, [meal("x", 800)])], s).total).toBe(2100); // come 2.100: nessun margine
  });

  it("un giorno futuro che ha già pasti conta con le sue kcal reali", () => {
    const d = [day(VEN, [meal("x", 2500)])];
    expect(previewDayTarget(SAB, GIO, d, s).total).toBe(2000);
  });

  it("i giorni passati senza pasti non entrano nel saldo", () => {
    const d = [day(LUN, [meal("a", 2500)])]; // mar e mer senza pasti
    expect(previewDayTarget(VEN, GIO, d, s).total).toBe(2000);
  });

  it("per un giorno non successivo a oggi vale l'obiettivo normale", () => {
    const d = [day(LUN, [meal("a", 2500)]), day(MAR, [])];
    expect(previewDayTarget(MAR, GIO, d, s)).toEqual(dayTarget(MAR, d, s));
    expect(previewDayTarget(GIO, GIO, d, s)).toEqual(dayTarget(GIO, d, s));
  });

  it("il bonus attività del giorno futuro si somma all'obiettivo", () => {
    const d = [day(VEN, [], { bikeKm: 30 })];
    expect(previewDayTarget(VEN, GIO, d, s).total).toBe(2505);
  });

  it("una settimana futura riparte da zero", () => {
    expect(previewDayTarget("2026-01-12", GIO, [day(DOM, [meal("a", 4000)])], s).total).toBe(2100);
  });
});
