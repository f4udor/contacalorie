import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { weekSummary } from "./week";
import type { Activity, Day, Meal } from "./types";

const s = DEFAULT_SETTINGS;
const noAct: Activity = { steps: null, bikeKm: null, bikeKcalHealth: null };

function meal(id: string, kcal: number, extra: Partial<Meal> = {}): Meal {
  return { id, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false, ...extra };
}
function day(date: string, meals: Meal[], activity: Partial<Activity> = {}): Day {
  return { date, meals, activity: { ...noAct, ...activity } };
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
    expect(w.days.every((d) => d.kcalEaten === 0 && !d.hasMeals && d.target === 2100)).toBe(true);
  });
});

describe("weekSummary: settimana con dati", () => {
  const days = [
    day(LUN, [meal("a", 1750, { protein: 100, carbs: 200, fat: 60, fiber: 20, salt: 4 })], { steps: 8000, bikeKm: 20 }),
    day(MAR, [meal("b", 1900, { protein: 120, carbs: 220, fat: 80, fiber: 30, salt: 6 })], { steps: 0 }),
    day(MER, [meal("c", 2250, { isFree: true }), meal("d", 500, { slot: "cena" })], { steps: 10000, bikeKm: 10 }),
    day("2026-01-08", []), // senza pasti
    day("2026-01-12", [meal("fuori", 9999)]), // altra settimana
  ];
  // La settimana è già conclusa (oggi è il lunedì dopo): nessun giorno è escluso dalla media.
  const w = weekSummary(MER, days, s, "2026-01-12");

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

  it("saldo sui giorni con pasti, con il tetto al margine", () => {
    // lun +670 → 300 (tetto); mar +200 → 300; mer +1035 → 300
    expect(w.balance).toBe(300);
  });

  it("media kcal reali sui giorni con pasti (non i 7 giorni)", () => {
    expect(w.avgKcal).toBeCloseTo((1750 + 1900 + 2750) / 3, 10);
  });

  it("medie dei nutrienti sui giorni con pasti", () => {
    expect(w.avgNutrients).toEqual({ protein: 220 / 3, carbs: 420 / 3, fat: 140 / 3, fiber: 50 / 3, salt: 10 / 3 });
  });

  it("km totali, passi medi solo sui giorni con passi, pasto libero", () => {
    expect(w.totalKm).toBe(30);
    expect(w.avgSteps).toBe(9000); // 8000 e 10000; il giorno con 0 passi non conta
    expect(w.freeMealUsed).toBe(true);
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

describe("media kcal sui giorni conclusi (§3.8, casi W, X, Y)", () => {
  const GIO = "2026-01-08";
  it("caso W: oggi giovedì; lun 2.000, mar senza pasti, mer 2.200, gio (oggi) 600 → media 2.100", () => {
    const days = [day(LUN, [meal("a", 2000)]), day(MER, [meal("c", 2200)]), day(GIO, [meal("g", 600)])];
    expect(weekSummary(GIO, days, s, GIO).avgKcal).toBe(2100);
  });
  it("caso X: oggi lunedì, pasti solo oggi → nessuna media", () => {
    expect(weekSummary(LUN, [day(LUN, [meal("a", 800)])], s, LUN).avgKcal).toBeNull();
  });
  it("caso Y: settimana passata con 7 giorni di pasti → media sui 7 giorni", () => {
    const days = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-11"].map((d, i) => day(d, [meal(`m${i}`, 1800 + i * 100)]));
    expect(weekSummary(LUN, days, s, "2026-01-20").avgKcal).toBe((1800 + 1900 + 2000 + 2100 + 2200 + 2300 + 2400) / 7);
  });
  it("oggi con pasti non conta, ma gli altri giorni sì; senza giorni validi il trattino", () => {
    const days = [day(LUN, [meal("a", 1500)]), day(MAR, [meal("b", 2500)])];
    expect(weekSummary(MAR, days, s, MAR).avgKcal).toBe(1500);
    expect(weekSummary(MAR, [day(MAR, [meal("b", 2500)])], s, MAR).avgKcal).toBeNull();
  });
  it("le medie dei nutrienti non cambiano: includono anche oggi", () => {
    const days = [day(LUN, [meal("a", 2000, { protein: 100 })]), day(GIO, [meal("g", 600, { protein: 20 })])];
    expect(weekSummary(GIO, days, s, GIO).avgNutrients?.protein).toBe(60);
  });
});

describe("saldo mostrato in Settimana sui giorni conclusi (§3.3, casi AJ, AK, AL, AM)", () => {
  it("caso AJ: lunedì 1.900; oggi è martedì, mangiate finora 600 → +200 (non 300)", () => {
    const days = [day(LUN, [meal("a", 1900)]), day(MAR, [meal("b", 600)])];
    expect(weekSummary(MAR, days, s, MAR).balance).toBe(200);
  });
  it("caso AK: oggi è lunedì, mangiate finora 600 → nessun saldo (trattino)", () => {
    expect(weekSummary(LUN, [day(LUN, [meal("a", 600)])], s, LUN).balance).toBeNull();
  });
  it("caso AL: lunedì 2.500; oggi è martedì senza pasti → −400", () => {
    expect(weekSummary(MAR, [day(LUN, [meal("a", 2500)])], s, MAR).balance).toBe(-400);
  });
  it("caso AM: settimana passata, lunedì 1.900 e domenica 2.000, altri giorni vuoti → +300 (tetto)", () => {
    const days = [day(LUN, [meal("a", 1900)]), day("2026-01-11", [meal("d", 2000)])];
    expect(weekSummary(LUN, days, s, "2026-01-20").balance).toBe(300);
  });
  it("oggi con pasti non entra nel saldo, anche se è l'unico giorno mangiato prima di un debito", () => {
    // lunedì 2.500 (−400) e oggi 100: il saldo resta −400, oggi non lo riporta a +1.600 né a +300
    const days = [day(LUN, [meal("a", 2500)]), day(MAR, [meal("b", 100)])];
    expect(weekSummary(MAR, days, s, MAR).balance).toBe(-400);
  });
  it("senza `today` nessun giorno è escluso", () => {
    expect(weekSummary(MAR, [day(LUN, [meal("a", 1900)]), day(MAR, [meal("b", 600)])], s).balance).toBe(300);
  });
  it("la funzione del saldo dell'obiettivo non cambia: l'obiettivo di martedì usa ancora i giorni precedenti", () => {
    const days = [day(LUN, [meal("a", 2500)]), day(MAR, [meal("b", 600)])];
    expect(weekSummary(MAR, days, s, MAR).days[1].target).toBe(2000);
  });
});
