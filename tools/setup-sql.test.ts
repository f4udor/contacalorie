import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error file .mjs senza tipi
import { UPDATE_HEADER_PHASE_5, buildSetupSql, buildUpdateSql } from "./build-setup-sql.mjs";

const root = path.resolve(__dirname, "..");

describe("supabase/setup.sql", () => {
  const generated: string = buildSetupSql(path.join(root, "supabase/migrations"));
  const onDisk = readFileSync(path.join(root, "supabase/setup.sql"), "utf8");

  it("è aggiornato: coincide con le migrazioni unite (rigenerare con npm run setup-sql)", () => {
    expect(onDisk).toBe(generated);
  });

  it("contiene tutte le tabelle previste dal brief, ognuna con la sicurezza per riga attiva", () => {
    for (const t of ["settings", "meals", "favorites", "daily_activity", "weigh_ins", "challenge_plans", "challenge_exercises", "challenge_log", "ingest_tokens", "ingest_log", "ai_usage", "favorite_meals"]) {
      expect(onDisk).toContain(`create table public.${t} `);
      expect(onDisk).toContain(`alter table public.${t} enable row level security`);
    }
  });

  it("contiene le aggiunte della fase 3 e nessuna colonna eliminata o rinominata", () => {
    expect(onDisk).toContain("add column quantity text");
    expect(onDisk).toContain("protein_per_kg_target");
    expect(onDisk).not.toMatch(/drop column|rename column|drop table/i);
  });

  it("le migrazioni sono in ordine", () => {
    const names = [...onDisk.matchAll(/-- ===== (\S+\.sql) =====/g)].map((m) => m[1]);
    expect(names).toEqual([...names].sort());
    expect(names.length).toBeGreaterThanOrEqual(5);
  });

  it("aggiornamento-fase-5.sql è aggiornato e contiene solo le migrazioni dalla 10", () => {
    const update = readFileSync(path.join(root, "supabase/aggiornamento-fase-5.sql"), "utf8");
    expect(update).toBe(buildUpdateSql(path.join(root, "supabase/migrations"), 10, UPDATE_HEADER_PHASE_5));
    const names = [...update.matchAll(/-- ===== (\S+\.sql) =====/g)].map((m) => m[1]);
    expect(names[0]).toBe("20260101000010_ingresso_salute.sql");
    expect(names.every((n) => Number(n.slice(0, 14)) >= 20260101000010)).toBe(true);
  });

  it("l'ingresso dei dati da Salute: funzione chiamabile senza sessione, solo impronta del codice", () => {
    expect(onDisk).toContain("create function public.ingest_health(");
    expect(onDisk).toContain("to anon, authenticated");
    expect(onDisk).toContain("sha256(convert_to(p_code");
    expect(onDisk).toContain("t.revoked_at is null");
  });
});
