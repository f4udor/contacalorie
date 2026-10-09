// Unisce tutte le migrazioni, in ordine, in `supabase/setup.sql`: un solo file da incollare nell'editor SQL di Supabase.
// Uso: npm run setup-sql
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const HEADER = `-- Personal Health: schema completo del database.
-- Incolla tutto questo file nell'editor SQL di Supabase (SQL Editor → New query) ed esegui UNA volta sola.
-- File generato da supabase/migrations con \`npm run setup-sql\`: non modificarlo a mano.
`;

export function buildSetupSql(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const parts = files.map((f) => `\n-- ===== ${f} =====\n${readFileSync(path.join(dir, f), "utf8").trimEnd()}\n`);
  return HEADER + parts.join("");
}

export const UPDATE_HEADER_PHASE_5 = `-- Aggiornamento per chi ha già eseguito setup.sql e aggiornamento-fase-4.sql (migrazioni 1-9).
-- Da eseguire UNA volta sola nell'editor SQL di Supabase (SQL Editor → New query).
-- File generato da supabase/migrations con \`npm run setup-sql\`: non modificarlo a mano.
`;

export const UPDATE_HEADER_PHASE_5B = `-- Aggiornamento per chi ha già eseguito setup.sql e gli aggiornamenti delle fasi 4 e 5 (migrazioni 1-12).
-- Da eseguire UNA volta sola nell'editor SQL di Supabase (SQL Editor → New query), prima di pubblicare la fase 5b.
-- File generato da supabase/migrations con \`npm run setup-sql\`: non modificarlo a mano.
`;

export const UPDATE_HEADER_PHASE_5C = `-- Aggiornamento per chi ha già eseguito setup.sql e gli aggiornamenti delle fasi 4, 5 e 5b (migrazioni 1-14).
-- Da eseguire UNA volta sola nell'editor SQL di Supabase (SQL Editor → New query), prima di pubblicare la fase 5c.
-- File generato da supabase/migrations con \`npm run setup-sql\`: non modificarlo a mano.
`;

/** Come buildSetupSql, ma solo le migrazioni dalla numero `from` alla numero `to` (compresa; senza `to`, fino all'ultima). */
export function buildUpdateSql(dir, from, header, to = Infinity) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && Number(f.slice(0, 14)) >= 20260101000000 + from && Number(f.slice(0, 14)) <= 20260101000000 + to)
    .sort();
  const parts = files.map((f) => `\n-- ===== ${f} =====\n${readFileSync(path.join(dir, f), "utf8").trimEnd()}\n`);
  return header + parts.join("");
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const root = process.cwd();
  writeFileSync(path.join(root, "supabase/setup.sql"), buildSetupSql(path.join(root, "supabase/migrations")));
  writeFileSync(path.join(root, "supabase/aggiornamento-fase-5.sql"), buildUpdateSql(path.join(root, "supabase/migrations"), 10, UPDATE_HEADER_PHASE_5, 14));
  writeFileSync(path.join(root, "supabase/aggiornamento-fase-5b.sql"), buildUpdateSql(path.join(root, "supabase/migrations"), 13, UPDATE_HEADER_PHASE_5B, 14));
  writeFileSync(path.join(root, "supabase/aggiornamento-fase-5c.sql"), buildUpdateSql(path.join(root, "supabase/migrations"), 15, UPDATE_HEADER_PHASE_5C));
  console.log("supabase/setup.sql e gli aggiornamenti delle fasi 5, 5b e 5c scritti");
}
