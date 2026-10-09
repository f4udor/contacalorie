import { describe, expect, it } from "vitest";
import { formatDateLong, formatDayMonth, formatNumber, formatSigned, formatWeekday, formatWeightDelta } from "./format";

describe("formatNumber", () => {
  it("separatore delle migliaia anche a 4 cifre e virgola decimale", () => {
    expect(formatNumber(1994)).toBe("1.994");
    expect(formatNumber(2100)).toBe("2.100");
    expect(formatNumber(12345)).toBe("12.345");
    expect(formatNumber(4.8, 1)).toBe("4,8");
    expect(formatNumber(5, 1)).toBe("5");
    expect(formatNumber(1993.75, 0)).toBe("1.994");
  });
  it("numeri negativi con il segno meno tipografico", () => {
    expect(formatNumber(-106)).toBe("−106");
    expect(formatNumber(-0.2)).toBe("0");
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatSigned", () => {
  it("segno esplicito", () => {
    expect(formatSigned(400)).toBe("+400");
    expect(formatSigned(-106)).toBe("−106");
    expect(formatSigned(0)).toBe("0");
    expect(formatSigned(1234)).toBe("+1.234");
  });
});

describe("date", () => {
  it("giorno della settimana e data in italiano", () => {
    expect(formatWeekday("2026-01-08")).toBe("Giovedì");
    expect(formatDayMonth("2026-01-08")).toBe("8 gennaio");
    expect(formatDateLong("2026-01-08")).toBe("Giovedì 8 gennaio");
    expect(formatDateLong("2026-03-01")).toBe("Domenica 1 marzo");
  });
});

describe("formatWeightDelta (T5b.7)", () => {
  it("sempre segno e un decimale, con il meno tipografico", () => {
    expect(formatWeightDelta(-0.4)).toBe("−0,4");
    expect(formatWeightDelta(-1.2)).toBe("−1,2");
    expect(formatWeightDelta(0.3)).toBe("+0,3");
    expect(formatWeightDelta(12)).toBe("+12,0");
    expect(formatWeightDelta(-1234.5)).toBe("−1.234,5");
  });
  it("una differenza che arrotondata vale 0,0 si scrive «0,0», senza segno", () => {
    expect(formatWeightDelta(0)).toBe("0,0");
    expect(formatWeightDelta(-0.04)).toBe("0,0");
    expect(formatWeightDelta(0.04)).toBe("0,0");
    expect(formatWeightDelta(-0.05)).toBe("−0,1");
  });
});

describe("formati dei pannelli della Settimana (T6.3)", () => {
  it("intervallo della settimana: stesso mese o mesi diversi", async () => {
    const { formatWeekRange } = await import("./format");
    expect(formatWeekRange("2026-10-05")).toBe("5 – 11 ottobre");
    expect(formatWeekRange("2026-09-28")).toBe("28 set – 4 ott");
  });
  it("giorno con numero e giorno in minuscolo", async () => {
    const { formatWeekdayDay, formatWeekdayLower } = await import("./format");
    expect(formatWeekdayDay("2026-10-05")).toBe("Lunedì 5");
    expect(formatWeekdayLower("2026-10-06")).toBe("martedì");
  });
});

describe("formatKg", () => {
  it("sempre un decimale, con la virgola", async () => {
    const { formatKg } = await import("./format");
    expect(formatKg(92)).toBe("92,0");
    expect(formatKg(98.6)).toBe("98,6");
    expect(formatKg(91.36)).toBe("91,4");
  });
});
