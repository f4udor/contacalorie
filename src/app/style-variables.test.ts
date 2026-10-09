import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ROLES } from "./lib/roles";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

/** I valori di BRIEF §10.2, per nome di ruolo. */
const EXPECTED: Record<string, string> = {
  sfondo: "#000000",
  scheda: "#151517",
  tessera: "#222224",
  pannello: "#111113",
  testo: "#f5f5f7",
  "testo-secondario": "#98989f",
  separatore: "#323234",
  comando: "#a6ff00",
  "in-obiettivo": "#0a84ff",
  attenzione: "#ffd60a",
  fuori: "#ff453a",
  sotto: "#8e8e93",
  passi: "#a78bfa",
  bici: "#ff9f0a",
  "linea-obiettivo": "#fa114f",
  "linea-media": "#f5f5f7",
};

const values = (name: string) => [...css.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))].map((m) => m[1].trim().toLowerCase());

describe("variabili di stile (BRIEF §10.2)", () => {
  it("ogni ruolo è definito una volta sola, con il valore di §10.2", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...ROLES].sort());
    for (const role of ROLES) expect(values(role), `--${role}`).toEqual([EXPECTED[role]]);
  });

  it("solo tema scuro: nessuna regola per il tema chiaro", () => {
    expect(css).not.toMatch(/prefers-color-scheme/);
    expect(css).toMatch(/color-scheme:\s*dark;/);
    expect(css).not.toMatch(/color-scheme:[^;]*light/);
  });

  it("ogni ruolo è disponibile come colore dei componenti (bg-…, text-…)", () => {
    for (const role of ROLES) expect(css).toContain(`--color-${role}: var(--${role});`);
  });

  it("raggi di §10.3: scheda 24, tessera 16, elenco 22", () => {
    expect(values("raggio-scheda")).toEqual(["24px"]);
    expect(values("raggio-tessera")).toEqual(["16px"]);
    expect(values("raggio-elenco")).toEqual(["22px"]);
  });

  it("i numeri usano il carattere arrotondato di sistema con ricaduta sul font di sistema", () => {
    expect(values("font-cifre")[0]).toMatch(/^ui-rounded,.*system-ui/);
  });
});
