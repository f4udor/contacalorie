import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const guida = readFileSync(path.join(root, "docs/COLLEGA-SALUTE.md"), "utf8");
const read = (f: string) => readFileSync(path.join(root, f), "utf8");

describe("docs/COLLEGA-SALUTE.md", () => {
  it("ha i passi numerati da 1 a 6, in ordine", () => {
    expect([...guida.matchAll(/^## Passo (\d+)\./gm)].map((m) => Number(m[1]))).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("dichiara che i nomi delle azioni non sono stati visti, il doppio conteggio e il telefono bloccato", () => {
    expect(guida).toMatch(/senza averli visti a schermo/);
    expect(guida).toMatch(/risultare doppi/);
    expect(guida).toMatch(/bloccato/);
    expect(guida).toMatch(/non è stata provata/);
  });

  it("i nomi tecnici coincidono con il codice: indirizzo, campi, intestazione, file SQL", () => {
    expect(existsSync(path.join(root, "src/app/api/ingest/health/route.ts"))).toBe(true);
    const parse = read("src/modules/activity/ingest.ts");
    for (const campo of ["passi", "bici_km"]) {
      expect(parse).toContain(`o.${campo}`);
      expect(guida).toContain(campo);
    }
    expect(guida).toContain("Authorization");
    expect(guida).toContain("Bearer ");
    expect(guida).toContain("yyyy-MM-dd");
    expect(guida).toContain("supabase/aggiornamento-fase-5.sql");
    expect(existsSync(path.join(root, "supabase/aggiornamento-fase-5.sql"))).toBe(true);
    expect(guida).toMatch(/200 chiamate/);
  });

  it("i messaggi citati sono quelli dell'ingresso", () => {
    const ingest = read("src/modules/activity/ingest.ts");
    expect(ingest).toContain("Codice non valido.");
    expect(ingest).toContain("Nessuna riga utile");
    expect(guida).toContain("Codice non valido.");
    expect(guida).toContain("Nessuna riga utile");
    expect(guida).toContain("data fuori da oggi e ieri");
    expect(ingest).toContain("data fuori da oggi e ieri");
  });

  it("i nomi dell'app citati esistono nell'app", () => {
    const sorgenti = [read("src/app/components/health-section.tsx"), read("src/app/components/health-warning.tsx")].join("\n");
    for (const testo of ["Crea codice", "Copia", "Fatto", "Rigenera codice", "Disattiva", "Nessun invio ancora", "Ultimo invio riuscito", "Nessun dato da Salute da ieri"]) {
      expect(sorgenti).toContain(testo);
    }
  });

  it("la scheda Attività di Oggi citata esiste e mostra la fonte; la guida non manda a funzioni non ancora presenti", () => {
    const card = read("src/app/components/activity-card.tsx");
    expect(card).toContain("Attività");
    expect(card).toContain("da Salute");
    expect(guida).toContain("scheda **Attività**");
    expect(guida).not.toMatch(/in \*\*Settimana\*\* toccando/);
  });

  it("nessuna nuova variabile su Vercel e nessun codice scritto nella guida", () => {
    expect(guida).toMatch(/nessuna nuova variabile/i);
    expect(guida).not.toMatch(/\bph[0-9a-f]{40,}/);
  });
});
