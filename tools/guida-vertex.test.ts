import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const guida = readFileSync(path.join(root, "docs/COLLEGA-VERTEX.md"), "utf8");
const config = readFileSync(path.join(root, "src/modules/ai/config.ts"), "utf8");

describe("docs/COLLEGA-VERTEX.md", () => {
  it("ha i passi numerati da 1 a 9, in ordine", () => {
    const passi = [...guida.matchAll(/^## Passo (\d+)\./gm)].map((m) => Number(m[1]));
    expect(passi).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("nomina tutte le variabili d'ambiente lette dal codice, e nessuna è pubblica", () => {
    for (const nome of ["VERTEX_PROJECT", "VERTEX_REGION", "VERTEX_MODEL", "VERTEX_CREDENTIALS_JSON", "AI_DAILY_LIMIT"]) {
      expect(config).toContain(nome);
      expect(guida).toContain(nome);
    }
    expect(guida).not.toMatch(/NEXT_PUBLIC_(VERTEX|AI)/);
    expect(guida).toMatch(/NEXT_PUBLIC_/); // dice di NON usare il prefisso
  });

  it("avverte che i nomi possono cambiare e che la chiave non va mai in chat né nel repository", () => {
    expect(guida).toMatch(/cambiano ogni tanto l'aspetto/);
    expect(guida).toMatch(/non va mai in chat/);
    expect(guida).toMatch(/GitHub/);
  });

  it("indica il ruolo minimo, la regione europea, l'avviso di budget e la ripubblicazione", () => {
    expect(guida).toContain("Vertex AI User");
    expect(guida).toContain("roles/aiplatform.user");
    expect(guida).toMatch(/europe-west/);
    expect(guida).toMatch(/Budgets & alerts/);
    expect(guida).toMatch(/Redeploy/);
    expect(guida).toMatch(/Un solo ruolo/);
  });

  it("non contiene chiavi: nessun blocco di chiave privata", () => {
    expect(guida).not.toMatch(/BEGIN (RSA )?PRIVATE KEY/);
    expect(guida).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
  });

  it("i nomi dell'app citati nella guida esistono davvero nell'app", () => {
    const sorgenti = ["src/app/components/ai-estimate.tsx", "src/app/components/links-section.tsx"].map((f) => readFileSync(path.join(root, f), "utf8")).join("\n");
    for (const testo of ["Cosa hai mangiato?", "Stima", "Correggi", "Rifai la stima", "Conferma", "Stime dei pasti", "Stato", "Attivo", "Non attivo", "Modello"]) {
      expect(sorgenti).toContain(testo);
    }
    expect(guida).toContain("Stima automatica non disponibile");
    expect(readFileSync(path.join(root, "src/modules/ai/types.ts"), "utf8")).toContain("Stima automatica non disponibile.");
  });
});
