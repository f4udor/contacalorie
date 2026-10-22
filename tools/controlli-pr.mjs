// Controlli 2-5 delle pull request verso dev (il controllo 1 è nel workflow).
// Uso: node tools/controlli-pr.mjs <branch> [riferimento-base]
// Stampa un errore per riga e esce con codice 1 se ce ne sono.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FILE_DI_PROCESSO = ["CLAUDE.md", ".claude/", "docs/METODO.md", "docs/ATTIVITA.md", "docs/AVVIO.md", ".github/", "docs/BRIEF.md"];

function git(dir, ...args) {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" });
}

function righe(testo) {
  return testo.split("\n").filter((r) => r.trim() !== "");
}

/** "lavoro" = <utente>/<n>-<parola>, "docs" = <utente>/docs-<parola>, altrimenti "altro". */
export function tipoBranch(branch) {
  if (/^[^/]+\/docs-[^/]+$/.test(branch)) return "docs";
  if (/^[^/]+\/\d+-[^/]+$/.test(branch)) return "lavoro";
  return "altro";
}

function datiLavoro(branch) {
  const m = /^[^/]+\/(\d+)-([^/]+)$/.exec(branch);
  if (!m) return null;
  return { n: m[1], parola: m[2], diario: `docs/lavori/${m[1]}-${m[2]}/DIARIO.md` };
}

/** Controllo 2: nessun file di processo toccato. */
export function controllaProcesso(dir, base) {
  const file = righe(git(dir, "diff", "--name-only", "--no-renames", `${base}...HEAD`));
  return file
    .filter((f) => FILE_DI_PROCESSO.some((p) => (p.endsWith("/") ? f.startsWith(p) : f === p)))
    .map((f) => `${f}: file di processo toccato. Non va modificato in un lavoro (solo le persone, con una pull request di documenti).`);
}

function sezione(testo, titolo) {
  const out = [];
  let dentro = false;
  for (const r of testo.split("\n")) {
    if (/^#{1,6}\s/.test(r)) dentro = r.toLowerCase().includes(titolo);
    else if (dentro) out.push(r);
  }
  return out.join("\n");
}

/** Controllo 3: i test del task T<n>.1 non sono modificati dai commit successivi. */
export function controllaTestAccettazione(dir, base, branch) {
  const lavoro = datiLavoro(branch);
  if (!lavoro) return [];
  const inizio = new RegExp(`^#${lavoro.n} T${lavoro.n}\\.1(\\s|$)`);
  const commit = righe(git(dir, "log", "--reverse", "--format=%H\t%s", `${base}..HEAD`)).map((r) => {
    const [sha, ...soggetto] = r.split("\t");
    return { sha, soggetto: soggetto.join("\t") };
  });
  const test = new Set();
  let trovato = false;
  const successivi = [];
  for (const c of commit) {
    if (inizio.test(c.soggetto)) {
      trovato = true;
      for (const f of righe(git(dir, "diff-tree", "--root", "--no-commit-id", "--name-only", "--no-renames", "--diff-filter=AM", "-r", c.sha))) test.add(f);
    } else if (trovato) {
      successivi.push(c);
    }
  }
  if (test.size === 0) return [];

  const pathDiario = path.join(dir, lavoro.diario);
  const giustificati = existsSync(pathDiario) ? sezione(readFileSync(pathDiario, "utf8"), "decisioni da confermare") : "";
  const errori = [];
  const visti = new Set();
  for (const c of successivi) {
    for (const f of righe(git(dir, "diff-tree", "--root", "--no-commit-id", "--name-only", "--no-renames", "-r", c.sha))) {
      if (!test.has(f) || visti.has(f) || giustificati.includes(f)) continue;
      visti.add(f);
      errori.push(`${f}: test di accettazione (task T${lavoro.n}.1) modificato dopo la sua scrittura. Va nominato nel diario sotto "Decisioni da confermare" con la riga dell'issue che lo giustifica, oppure ripristinato.`);
    }
  }
  return errori;
}

/** Controllo 4: ogni riga di task chiuso nel diario riporta il verdetto del revisore. */
export function controllaDiario(dir, branch) {
  const lavoro = datiLavoro(branch);
  if (!lavoro) return [];
  const pathDiario = path.join(dir, lavoro.diario);
  if (!existsSync(pathDiario)) return [`${lavoro.diario}: diario del lavoro mancante. Serve una riga per ogni task chiuso, con "revisore: APPROVATO" o "revisore: RESPINTO".`];
  const errori = [];
  for (const r of readFileSync(pathDiario, "utf8").split("\n")) {
    if (/^#{1,6}\s+(decisioni da confermare|non verificato)/i.test(r)) break;
    const m = /^[\s\-*|]*(T\d+\.\d+)/.exec(r);
    if (!m || /report/i.test(r)) continue;
    if (!/revisore:\s*(APPROVATO|RESPINTO)/.test(r)) {
      errori.push(`${lavoro.diario}: la riga di ${m[1]} non ha il verdetto del revisore. Aggiungi "revisore: APPROVATO" o "revisore: RESPINTO".`);
    }
  }
  return errori;
}

/** Controllo 5: migrazioni esistenti intatte, aggiornamenti SQL con sole aggiunte. */
export function controllaDatabase(dir, base) {
  const errori = [];
  const modifiche = righe(git(dir, "diff", "--name-status", "--no-renames", `${base}...HEAD`, "--", "supabase"));
  for (const r of modifiche) {
    const [stato, file] = r.split("\t");
    if (file.startsWith("supabase/migrations/") && stato !== "A") {
      errori.push(`${file}: migrazione esistente ${stato === "D" ? "cancellata" : "modificata"}. Le migrazioni non si toccano: aggiungi un file nuovo con il numero successivo.`);
    }
    if (/^supabase\/aggiornamento-[^/]*\.sql$/.test(file) && stato !== "D") {
      const sql = readFileSync(path.join(dir, file), "utf8")
        .split("\n")
        .map((l) => l.replace(/--.*$/, ""))
        .join("\n");
      const vietati = [
        [/\bdrop\b/i, "drop"],
        [/\brename\b/i, "rename"],
        [/\balter\s+column\b[^;]*\btype\b/i, "alter column … type"],
      ];
      for (const [re, nome] of vietati) {
        if (re.test(sql)) errori.push(`${file}: contiene "${nome}". Il database cresce solo per aggiunte: niente eliminazioni, rinomine o cambi di tipo.`);
      }
    }
  }
  return errori;
}

/** Tutti i controlli che valgono per il branch (il controllo 1 sta nel workflow). */
export function eseguiControlli(dir, branch, base) {
  const tipo = tipoBranch(branch);
  if (tipo === "docs") return [];
  if (tipo === "altro") return controllaDatabase(dir, base);
  return [...controllaProcesso(dir, base), ...controllaTestAccettazione(dir, base, branch), ...controllaDiario(dir, branch), ...controllaDatabase(dir, base)];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [branch, base = "origin/dev"] = process.argv.slice(2);
  if (!branch) {
    console.error("Uso: node tools/controlli-pr.mjs <branch> [riferimento-base]");
    process.exit(2);
  }
  const errori = eseguiControlli(process.cwd(), branch, base);
  for (const e of errori) console.log(`❌ ${e}`);
  if (errori.length) process.exit(1);
  console.log("✅ Controlli 2-5 passati.");
}
