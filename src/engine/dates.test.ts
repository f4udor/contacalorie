import { describe, expect, it } from "vitest";
import { addDays, weekDates, weekdayIndex, weekStart } from "./dates";

describe("date", () => {
  it("lunedì = 0 e domenica = 6", () => {
    expect(weekdayIndex("2026-01-05")).toBe(0); // lunedì
    expect(weekdayIndex("2026-01-11")).toBe(6); // domenica
  });

  it("weekStart restituisce il lunedì", () => {
    expect(weekStart("2026-01-07")).toBe("2026-01-05");
    expect(weekStart("2026-01-05")).toBe("2026-01-05");
    expect(weekStart("2026-01-11")).toBe("2026-01-05");
  });

  it("attraversa mesi e anni", () => {
    expect(weekDates("2026-01-01")).toEqual([
      "2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04",
    ]);
  });

  it("non risente dei cambi di ora legale", () => {
    expect(weekDates("2026-03-29")[0]).toBe("2026-03-23");
    expect(weekDates("2026-03-29")).toHaveLength(7);
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });

  it("anno bisestile", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("rifiuta date non valide", () => {
    expect(() => weekdayIndex("2026-02-30")).toThrow();
    expect(() => weekdayIndex("pippo")).toThrow();
  });
});
