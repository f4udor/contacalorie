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

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const root = process.cwd();
  writeFileSync(path.join(root, "supabase/setup.sql"), buildSetupSql(path.join(root, "supabase/migrations")));
  console.log("supabase/setup.sql scritto");
}
