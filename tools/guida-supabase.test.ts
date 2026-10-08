import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const guida = readFileSync(path.join(root, "docs/COLLEGA-SUPABASE.md"), "utf8");

describe("docs/COLLEGA-SUPABASE.md", () => {
  it("ha i passi numerati da 1 a 10, in ordine", () => {
    const passi = [...guida.matchAll(/^## Passo (\d+)\./gm)].map((m) => Number(m[1]));
    expect(passi).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("nomina le due variabili d'ambiente lette dal codice e il file dello schema", () => {
    const factory = readFileSync(path.join(root, "src/data/factory.ts"), "utf8");
    for (const nome of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) {
      expect(factory).toContain(nome);
      expect(guida).toContain(nome);
    }
    expect(guida).toContain("supabase/setup.sql");
  });

  it("il modello dell'email mostra il codice, non il link, e avverte di non copiare la chiave segreta", () => {
    expect(guida).toContain("{{ .Token }}");
    expect(guida).not.toContain("{{ .ConfirmationURL }}");
    expect(guida).toMatch(/service_role/);
    expect(guida).toMatch(/Redeploy/);
  });

  it("i nomi dei pulsanti dell'app citati nella guida esistono davvero nell'app", () => {
    const sorgenti = ["src/app/components/login-screen.tsx", "src/app/components/import-sheet.tsx", "src/app/impostazioni-screen.tsx", "src/app/components/data-section.tsx"]
      .map((f) => readFileSync(path.join(root, f), "utf8"))
      .join("\n");
    for (const testo of ["Invia il codice", "Invia un nuovo codice", "Accedi", "Importa", "Tienili per ora", "Esci", "Esporta"]) {
      expect(sorgenti).toContain(testo);
    }
    expect(sorgenti).toContain("Tutto a posto: togli i dati da questo dispositivo");
  });
});
