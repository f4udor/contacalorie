import { describe, expect, it } from "vitest";
import { weekWeight } from "./week-weight";

const w = (date: string, weightKg: number) => ({ date, weightKg });
const monday = "2026-10-05";

describe("weekWeight", () => {
  it("nessuna pesata nella settimana: niente etichetta", () => {
    expect(weekWeight([w("2026-10-01", 80)], monday, 82, 75)).toBeNull();
  });
  it("confronta l'ultima pesata della settimana con l'ultima prima del lunedì", () => {
    const r = weekWeight([w("2026-09-28", 80), w("2026-10-01", 79.8), w("2026-10-06", 79.6), w("2026-10-11", 79.3)], monday, 82, 75);
    expect(r).toEqual({ kg: 79.3, diff: -0.5, tone: "ok" });
  });
  it("senza pesate precedenti usa il peso di partenza del profilo", () => {
    expect(weekWeight([w("2026-10-07", 81.4)], monday, 82, 75)).toEqual({ kg: 81.4, diff: -0.6, tone: "ok" });
  });
  it("allontanarsi dall'obiettivo è rosso, anche quando l'obiettivo è salire", () => {
    expect(weekWeight([w("2026-10-01", 80), w("2026-10-07", 80.4)], monday, null, 75)?.tone).toBe("bad");
    expect(weekWeight([w("2026-10-01", 60), w("2026-10-07", 59.5)], monday, null, 65)?.tone).toBe("bad");
    expect(weekWeight([w("2026-10-01", 60), w("2026-10-07", 60.5)], monday, null, 65)?.tone).toBe("ok");
  });
  it("senza obiettivo o senza variazione resta neutro", () => {
    expect(weekWeight([w("2026-10-01", 80), w("2026-10-07", 79)], monday, null, null)?.tone).toBe("neutro");
    expect(weekWeight([w("2026-10-01", 80), w("2026-10-07", 80)], monday, null, 75)).toEqual({ kg: 80, diff: 0, tone: "neutro" });
  });
  it("senza pesate precedenti né peso di partenza: peso senza differenza", () => {
    expect(weekWeight([w("2026-10-07", 80)], monday, null, 75)).toEqual({ kg: 80, diff: null, tone: "neutro" });
  });
  it("le pesate non ordinate vengono ordinate per data", () => {
    expect(weekWeight([w("2026-10-09", 79), w("2026-10-06", 79.5), w("2026-10-02", 80)], monday, null, null)).toMatchObject({ kg: 79, diff: -1 });
  });
});
