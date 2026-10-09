import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|tsx|css)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

const files = sources(path.join(root, "src")).map((f) => ({ file: path.relative(root, f), text: readFileSync(f, "utf8") }));

/**
 * BRIEF §10.2–10.3: colori, raggi e caratteri stanno solo in `src/app/globals.css`. Eccezioni (scritte anche nel diario):
 * il colore del tema in `layout.tsx` e `manifest.ts` (i metadati non leggono le variabili CSS) e `font-mono` per il codice di Salute.
 */
const FORBIDDEN: { nome: string; re: RegExp }[] = [
  { nome: "colore esadecimale", re: /#[0-9a-fA-F]{3,8}\b/ },
  { nome: "rgb/rgba/hsl", re: /\b(rgba?|hsla?)\(/ },
  { nome: "colore predefinito di Tailwind", re: /\b(text|bg|border|fill|stroke|ring|divide|from|to|via)-(black|white|gray|neutral|zinc|slate|stone|red|green|blue|yellow|orange|purple|amber|lime|emerald|sky|indigo|violet|pink|rose)(-\d+)?\b/ },
  { nome: "raggio predefinito di Tailwind", re: /\brounded(-[trbl]{1,2})?-(sm|md|lg|xl|2xl|3xl)\b/ },
  { nome: "carattere scritto a mano", re: /\bfont-(serif|\[)|font-family|fontFamily/ },
  { nome: "nome di colore vecchio", re: /\b(text|bg|border|ring|fill|stroke|divide)-(muted|card|fg|line|track|accent|ok|warn|bad|avg-line|bg)\b|-(ok|warn|bad)-fill\b|bad-btn/ },
];
const ECCEZIONI: Record<string, string[]> = {
  "src/app/layout.tsx": ["colore esadecimale"],
  "src/app/manifest.ts": ["colore esadecimale"],
};

describe("stile: nessun colore, raggio o carattere scritto a mano fuori da globals.css", () => {
  for (const { nome, re } of FORBIDDEN) {
    it(nome, () => {
      const found = files
        .filter((f) => f.file !== "src/app/globals.css" && !ECCEZIONI[f.file]?.includes(nome))
        .filter((f) => re.test(f.text))
        .map((f) => f.file);
      expect(found).toEqual([]);
    });
  }

  it("non resta nessuno screenshot -chiaro", () => {
    expect(readdirSync(path.join(root, "docs/screenshots")).filter((n) => n.includes("-chiaro"))).toEqual([]);
  });
});
