import { describe, expect, it } from "vitest";
import { weekWeight } from "./week-weight";

const MON = "2026-01-05";
const SUN = "2026-01-11";
const w = (date: string, weightKg: number) => ({ date, weightKg });
const run = (weighIns: ReturnType<typeof w>[], extra: { profileWeightKg?: number; targetWeightKg?: number } = {}) => weekWeight({ monday: MON, sunday: SUN, weighIns, ...extra });

describe("weekWeight", () => {
  it("nessuna pesata nella settimana: null (anche con pesate prima e dopo)", () => {
    expect(run([])).toBeNull();
    expect(run([w("2026-01-04", 92), w("2026-01-12", 91)], { profileWeightKg: 95 })).toBeNull();
  });

  it("confronto con la pesata precedente al lunedì (e non con il peso del profilo)", () => {
    const r = run([w("2026-01-02", 93), w("2026-01-07", 92.4)], { profileWeightKg: 100 });
    expect(r).toMatchObject({ lastKg: 92.4, lastDate: "2026-01-07", deltaKg: -0.6, comparedWith: "pesata" });
  });

  it("usa l'ultima pesata precedente, non la più vecchia", () => {
    const r = run([w("2025-12-20", 99), w("2026-01-03", 93), w("2026-01-06", 92)]);
    expect(r?.deltaKg).toBe(-1);
  });

  it("senza pesate precedenti: confronto con il peso di partenza del profilo", () => {
    const r = run([w("2026-01-06", 91.5)], { profileWeightKg: 92.5 });
    expect(r).toMatchObject({ deltaKg: -1, comparedWith: "profilo" });
  });

  it("senza pesate precedenti né peso del profilo: nessuna differenza, tono neutro", () => {
    expect(run([w("2026-01-06", 91.5)], { targetWeightKg: 85 })).toEqual({ lastKg: 91.5, lastDate: "2026-01-06", deltaKg: null, comparedWith: null, tone: "neutral" });
  });

  it("più pesate nella settimana: conta l'ultima per data", () => {
    const r = run([w("2026-01-05", 93), w("2026-01-09", 91), w("2026-01-07", 92)], { profileWeightKg: 94 });
    expect(r).toMatchObject({ lastKg: 91, lastDate: "2026-01-09", deltaKg: -3 });
  });

  it("pesate non ordinate: stesso risultato di quelle ordinate", () => {
    const ordered = [w("2025-12-30", 94), w("2026-01-03", 93), w("2026-01-06", 92.2), w("2026-01-10", 91.8)];
    const shuffled = [ordered[2], ordered[0], ordered[3], ordered[1]];
    expect(run(shuffled, { targetWeightKg: 85 })).toEqual(run(ordered, { targetWeightKg: 85 }));
    expect(run(shuffled)).toMatchObject({ lastKg: 91.8, deltaKg: -1.2, comparedWith: "pesata" });
  });

  it("lunedì e domenica sono dentro la settimana; il giorno prima del lunedì no", () => {
    expect(run([w(MON, 90)])?.lastDate).toBe(MON);
    expect(run([w(SUN, 90)])?.lastDate).toBe(SUN);
    const r = run([w("2026-01-04", 93), w(MON, 92)]);
    expect(r).toMatchObject({ deltaKg: -1, comparedWith: "pesata" });
  });

  describe("colore", () => {
    it("obiettivo sotto: scendere è verde, salire è rosso", () => {
      expect(run([w("2026-01-06", 91)], { profileWeightKg: 92, targetWeightKg: 85 })?.tone).toBe("ok");
      expect(run([w("2026-01-06", 93)], { profileWeightKg: 92, targetWeightKg: 85 })?.tone).toBe("bad");
    });
    it("obiettivo sopra (si vuole salire): salire è verde, scendere è rosso", () => {
      expect(run([w("2026-01-06", 61)], { profileWeightKg: 60, targetWeightKg: 70 })?.tone).toBe("ok");
      expect(run([w("2026-01-06", 59)], { profileWeightKg: 60, targetWeightKg: 70 })?.tone).toBe("bad");
    });
    it("senza peso obiettivo: neutro", () => {
      expect(run([w("2026-01-06", 91)], { profileWeightKg: 92 })?.tone).toBe("neutral");
    });
    it("variazione zero (anche dopo l'arrotondamento a una cifra): neutro", () => {
      expect(run([w("2026-01-06", 92)], { profileWeightKg: 92, targetWeightKg: 85 })).toMatchObject({ deltaKg: 0, tone: "neutral" });
      expect(run([w("2026-01-06", 92.04)], { profileWeightKg: 92, targetWeightKg: 85 })).toMatchObject({ deltaKg: 0, tone: "neutral" });
    });
    it("si supera l'obiettivo dall'altra parte: conta la distanza (più vicino = verde, più lontano = rosso, pari = neutro)", () => {
      expect(run([w("2026-01-06", 84.5)], { profileWeightKg: 86, targetWeightKg: 85 })?.tone).toBe("ok"); // da 1 a 0,5
      expect(run([w("2026-01-06", 83)], { profileWeightKg: 86, targetWeightKg: 85 })?.tone).toBe("bad"); // da 1 a 2
      expect(run([w("2026-01-06", 84)], { profileWeightKg: 86, targetWeightKg: 85 })?.tone).toBe("neutral"); // da 1 a 1
    });
  });
});
