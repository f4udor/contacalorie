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

/** Come buildSetupSql, ma solo le migrazioni dalla numero \`from\` in poi. */
export function buildUpdateSql(dir, from, header) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && Number(f.slice(0, 14)) >= 20260101000000 + from)
    .sort();
  const parts = files.map((f) => `\n-- ===== ${f} =====\n${readFileSync(path.join(dir, f), "utf8").trimEnd()}\n`);
  return header + parts.join("");
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const root = process.cwd();
  writeFileSync(path.join(root, "supabase/setup.sql"), buildSetupSql(path.join(root, "supabase/migrations")));
  writeFileSync(path.join(root, "supabase/aggiornamento-fase-5.sql"), buildUpdateSql(path.join(root, "supabase/migrations"), 10, UPDATE_HEADER_PHASE_5));
  console.log("supabase/setup.sql e supabase/aggiornamento-fase-5.sql scritti");
}
