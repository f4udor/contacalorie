import { describe, expect, it } from "vitest";
import { formatDateLong, formatDayMonth, formatNumber, formatSigned, formatWeekday } from "./format";

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
