import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  controllaDatabase,
  controllaDiario,
  controllaProcesso,
  controllaTestAccettazione,
  eseguiControlli,
  tipoBranch,
  // @ts-expect-error file .mjs senza tipi
} from "./controlli-pr.mjs";

const cartelle: string[] = [];

function git(dir: string, ...args: string[]) {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" });
}

function scrivi(dir: string, file: string, testo: string) {
  const p = path.join(dir, file);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, testo);
}

function salva(dir: string, messaggio: string) {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", messaggio);
}

/** Repository finto: branch `dev` con un po' di file, poi un branch di lavoro. */
function nuovoRepo(branch: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "controlli-pr-"));
  cartelle.push(dir);
  git(dir, "init", "-q", "-b", "dev");
  git(dir, "config", "user.email", "prova@example.com");
  git(dir, "config", "user.name", "Prova");
  scrivi(dir, "CLAUDE.md", "regole\n");
  scrivi(dir, "src/x.ts", "export const x = 1;\n");
  scrivi(dir, "supabase/migrations/20260101000001_tabelle_utente.sql", "create table a (id int);\n");
  salva(dir, "base");
  git(dir, "checkout", "-q", "-b", branch);
  return dir;
}

afterEach(() => {
  while (cartelle.length) rmSync(cartelle.pop()!, { recursive: true, force: true });
});

const BASE = "dev";

describe("riconoscimento del branch", () => {
  it("distingue lavori, documenti e altri nomi", () => {
    expect(tipoBranch("f4udor/64-controlli")).toBe("lavoro");
    expect(tipoBranch("f4udor/docs-orientamento")).toBe("docs");
    expect(tipoBranch("qualcosa-di-strano")).toBe("altro");
  });

  it("un branch docs- non ha errori anche se tocca file di processo e migrazioni", () => {
    const dir = nuovoRepo("f4udor/docs-orientamento");
    scrivi(dir, "CLAUDE.md", "cambiato\n");
    scrivi(dir, "supabase/migrations/20260101000001_tabelle_utente.sql", "drop table a;\n");
    salva(dir, "docs");
    expect(eseguiControlli(dir, "f4udor/docs-orientamento", BASE)).toEqual([]);
  });

  it("un branch di lavoro fa i controlli 2-5", () => {
    const dir = nuovoRepo("f4udor/64-controlli");
    scrivi(dir, "CLAUDE.md", "cambiato\n");
    salva(dir, "tocco");
    const errori: string[] = eseguiControlli(dir, "f4udor/64-controlli", BASE);
    expect(errori.some((e) => e.includes("CLAUDE.md"))).toBe(true);
  });
});

describe("controllo 2: file di processo", () => {
  it("passa se il branch tocca solo src/x.ts", () => {
    const dir = nuovoRepo("f4udor/5-prova");
    scrivi(dir, "src/x.ts", "export const x = 2;\n");
    salva(dir, "#5 T5.2 codice");
    expect(controllaProcesso(dir, BASE)).toEqual([]);
  });

  it.each([
    "CLAUDE.md",
    ".claude/agents/revisore.md",
    "docs/METODO.md",
    "docs/ATTIVITA.md",
    "docs/AVVIO.md",
    ".github/workflows/a.yml",
    "docs/BRIEF.md",
  ])("fallisce se il branch tocca %s", (file) => {
    const dir = nuovoRepo("f4udor/5-prova");
    scrivi(dir, file, "cambiato\n");
    salva(dir, "tocco");
    const errori: string[] = controllaProcesso(dir, BASE);
    expect(errori).toHaveLength(1);
    expect(errori[0]).toContain(file);
    expect(errori[0]).toMatch(/non (va|può|deve)|processo/i);
  });

  it("con più file di processo dà un errore per file", () => {
    const dir = nuovoRepo("f4udor/5-prova");
    scrivi(dir, "CLAUDE.md", "cambiato\n");
    scrivi(dir, "docs/METODO.md", "cambiato\n");
    scrivi(dir, "src/x.ts", "export const x = 3;\n");
    salva(dir, "tocco");
    const errori: string[] = controllaProcesso(dir, BASE);
    expect(errori).toHaveLength(2);
    expect(errori.join("\n")).toContain("CLAUDE.md");
    expect(errori.join("\n")).toContain("docs/METODO.md");
  });
});

describe("controllo 3: test di accettazione non modificati", () => {
  const branch = "f4udor/5-prova";

  function conTestAccettazione() {
    const dir = nuovoRepo(branch);
    scrivi(dir, "src/a.test.ts", "// test v1\n");
    salva(dir, "#5 T5.1 test di accettazione");
    return dir;
  }

  it("passa se i commit successivi non toccano i test", () => {
    const dir = conTestAccettazione();
    scrivi(dir, "src/x.ts", "export const x = 4;\n");
    salva(dir, "#5 T5.2 codice");
    expect(controllaTestAccettazione(dir, BASE, branch)).toEqual([]);
  });

  it("fallisce se un commit successivo modifica il test", () => {
    const dir = conTestAccettazione();
    scrivi(dir, "src/a.test.ts", "// test v2\n");
    salva(dir, "#5 T5.2 codice");
    const errori: string[] = controllaTestAccettazione(dir, BASE, branch);
    expect(errori).toHaveLength(1);
    expect(errori[0]).toContain("src/a.test.ts");
  });

  it("passa se modifica il test ma il diario lo nomina sotto Decisioni da confermare", () => {
    const dir = conTestAccettazione();
    scrivi(dir, "src/a.test.ts", "// test v2\n");
    scrivi(
      dir,
      "docs/lavori/5-prova/DIARIO.md",
      "T5.1 fatto · revisore: APPROVATO\n\n## Decisioni da confermare\n- src/a.test.ts corretto: contraddiceva l'issue\n\n## Non verificato\n- niente\n",
    );
    salva(dir, "#5 T5.2 codice");
    expect(controllaTestAccettazione(dir, BASE, branch)).toEqual([]);
  });

  it("passa se non esiste nessun commit T5.1", () => {
    const dir = nuovoRepo(branch);
    scrivi(dir, "src/a.test.ts", "// test\n");
    salva(dir, "#5 T5.2 codice");
    scrivi(dir, "src/a.test.ts", "// test cambiato\n");
    salva(dir, "#5 T5.3 codice");
    expect(controllaTestAccettazione(dir, BASE, branch)).toEqual([]);
  });
});

describe("controllo 4: verdetto del revisore nel diario", () => {
  const branch = "f4udor/5-prova";
  const file = "docs/lavori/5-prova/DIARIO.md";

  it("passa con i verdetti e il task del report escluso", () => {
    const dir = nuovoRepo(branch);
    scrivi(
      dir,
      file,
      [
        "T5.1 · fatto · test scritti · revisore: APPROVATO",
        "T5.2 · bloccato · motivo · revisore: RESPINTO",
        "T5.3 Report · fatto",
        "",
        "## Decisioni da confermare",
        "- nessuna",
        "",
      ].join("\n"),
    );
    salva(dir, "#5 T5.3 report");
    expect(controllaDiario(dir, branch)).toEqual([]);
  });

  it("fallisce se una riga di task chiuso non ha il verdetto", () => {
    const dir = nuovoRepo(branch);
    scrivi(dir, file, "T5.1 · fatto · revisore: APPROVATO\nT5.2 · fatto\n");
    salva(dir, "#5 T5.2 codice");
    const errori: string[] = controllaDiario(dir, branch);
    expect(errori).toHaveLength(1);
    expect(errori[0]).toContain(file);
    expect(errori[0]).toContain("T5.2");
  });

  it("fallisce se il DIARIO.md manca", () => {
    const dir = nuovoRepo(branch);
    const errori: string[] = controllaDiario(dir, branch);
    expect(errori).toHaveLength(1);
    expect(errori[0]).toContain(file);
  });
});

describe("controllo 5: database", () => {
  const migrazione = "supabase/migrations/20260101000001_tabelle_utente.sql";

  it("passa aggiungendo una migrazione nuova e un aggiornamento con solo aggiunte", () => {
    const dir = nuovoRepo("f4udor/5-prova");
    scrivi(dir, "supabase/migrations/20260101000099_nuova.sql", "alter table x add column y text;\n");
    scrivi(dir, "supabase/aggiornamento-9.sql", "alter table x add column y text;\n");
    salva(dir, "#5 T5.2 db");
    expect(controllaDatabase(dir, BASE)).toEqual([]);
  });

  it("fallisce se una migrazione esistente è modificata", () => {
    const dir = nuovoRepo("f4udor/5-prova");
    scrivi(dir, migrazione, "create table a (id int, b int);\n");
    salva(dir, "db");
    const errori: string[] = controllaDatabase(dir, BASE);
    expect(errori).toHaveLength(1);
    expect(errori[0]).toContain(migrazione);
  });

  it("fallisce se una migrazione esistente è cancellata", () => {
    const dir = nuovoRepo("f4udor/5-prova");
    git(dir, "rm", "-q", migrazione);
    salva(dir, "db");
    const errori: string[] = controllaDatabase(dir, BASE);
    expect(errori).toHaveLength(1);
    expect(errori[0]).toContain(migrazione);
  });

  it.each(["DROP TABLE x;", "alter table x drop column y;", "alter table x Rename column a to b;", "ALTER COLUMN y TYPE int;"])(
    "fallisce se aggiornamento-9.sql contiene %s",
    (sql) => {
      const dir = nuovoRepo("f4udor/5-prova");
      scrivi(dir, "supabase/aggiornamento-9.sql", `${sql}\n`);
      salva(dir, "db");
      const errori: string[] = controllaDatabase(dir, BASE);
      expect(errori.length).toBeGreaterThan(0);
      expect(errori[0]).toContain("supabase/aggiornamento-9.sql");
    },
  );

  it("passa se le parole vietate stanno solo in un commento", () => {
    const dir = nuovoRepo("f4udor/5-prova");
    scrivi(dir, "supabase/aggiornamento-9.sql", "-- niente drop, rename o alter column x type\nalter table x add column y text;\n");
    salva(dir, "db");
    expect(controllaDatabase(dir, BASE)).toEqual([]);
  });
});
