import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const chart = readFileSync(new URL("./components/week-chart.tsx", import.meta.url), "utf8");

/** Le variabili di un blocco: la prima occorrenza è il tema chiaro (`:root`), la seconda quello scuro. */
function values(name: string): string[] {
  return [...css.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))].map((m) => m[1].trim().toLowerCase());
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("colore della linea della media (T5c.2)", () => {
  const [light, dark] = values("avg-line");

  it("ha una variabile di stile con un nome suo, in chiaro e in scuro", () => {
    expect(light).toMatch(/^#[0-9a-f]{6}$/);
    expect(dark).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("è diverso da accento, obiettivo (testo) e semafori, in ciascun tema", () => {
    for (const [i, own] of [light, dark].entries()) {
      for (const other of ["accent", "fg", "ok", "warn", "bad", "ok-fill", "warn-fill", "bad-fill"]) {
        expect(own, `--${other} (tema ${i === 0 ? "chiaro" : "scuro"})`).not.toBe(values(other)[i]);
      }
    }
  });

  it("ha contrasto sufficiente (almeno 4,5) sullo sfondo delle schede", () => {
    expect(contrast(light, values("card")[0])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark, values("card")[1])).toBeGreaterThanOrEqual(4.5);
  });

  it("linea e voce di legenda usano la variabile, non più il grigio neutro", () => {
    expect(chart.match(/border-avg-line/g)).toHaveLength(2);
    expect(chart).not.toContain("border-muted");
  });
});
