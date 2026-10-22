# #64 Controllo automatico sulle pull request verso dev

Issue: #64 · Responsabile: f4udor · Branch: f4udor/64-controlli
Obiettivo: ogni pull request verso `dev` ottiene da GitHub una spunta verde o una croce rossa, con righe in italiano che dicono cosa non va e in quale file.
Sezioni del brief: nessuna (strumento di lavoro).
Vincoli: database no (nessuna migrazione, nessun SQL). Si toccano solo `.github/workflows/`, `tools/`, `CLAUDE.md` (una sola riga, sezione "Cartella del lavoro", voce `DIARIO.md`) e la cartella del lavoro. Nessun segreto, nessun servizio oltre a GitHub, nessuna dipendenza nuova (solo moduli di Node). Non toccare `docs/BRIEF.md`, `.claude/`, `docs/METODO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`.

## Scelte del pianificatore
- Il repository non dichiara una versione di Node (niente `.nvmrc`, niente `engines`). La versione usata oggi per il build nell'ambiente è la 22: il workflow usa `node-version: 22`. Da confermare nel diario.
- Script unico `tools/controlli-pr.mjs`: esporta una funzione per controllo (2, 3, 4, 5) che riceve la cartella del repository, il nome del branch e il riferimento base (`origin/dev`), e restituisce un elenco di errori (stringhe in italiano, ognuna con il file). Un `main` da riga di comando le lancia, stampa gli errori e esce con codice 1 se ce ne sono. Il tipo di branch si riconosce dal nome: `<utente>/<n>-<parola>` = lavoro; `<utente>/docs-<parola>` = documenti (solo controllo 1, quindi lo script non fa nulla); altri nomi: solo controllo 1 e database (5).
- L'issue dice che il controllo 5 vale per «tutte le pull request» ma anche che le `docs-` fanno «solo il controllo 1». Scelta: si segue la seconda frase, `docs-` = solo controllo 1. Da confermare nel diario.
- Il confronto con `dev` usa `git diff --name-status origin/dev...HEAD` (punto di partenza comune). Il workflow fa checkout con `fetch-depth: 0`.
- Controllo 3: i file di test del task `T<n>.1` sono quelli aggiunti/cambiati dai commit il cui messaggio (prima riga) inizia con `#<n> T<n>.1`. Un commit successivo del branch che li modifica o li cancella è un errore, salvo che il `DIARIO.md` li nomini (percorso del file) sotto "Decisioni da confermare". Se non c'è nessun commit `T<n>.1`, il controllo passa.
- Controllo 4: righe di task chiuso nel `DIARIO.md` = righe che iniziano con un codice task `T<n>.<k>` (anche dopo `-`, `*`, `|` o spazi); il task del report si riconosce dalla parola "Report" (senza distinzione di maiuscole) nella riga ed è escluso. Le sezioni "Decisioni da confermare" e "Non verificato" non sono controllate.
- Controllo 5 sul database: per `supabase/migrations/` fallisce ogni file con stato M, D o R (modificato, cancellato, rinominato) rispetto a `dev`; i file aggiunti (A) sono ok. Per `supabase/aggiornamento-*.sql` aggiunti o modificati si cercano nel testo, senza distinzione di maiuscole, `drop`, `rename`, `alter column … type`; i commenti SQL (`-- …`) sono ignorati.
- Controllo 2: confronta i file toccati con l'elenco `CLAUDE.md`, `.claude/`, `docs/METODO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, `.github/`, `docs/BRIEF.md`. Il lavoro #64 stesso è autorizzato a toccare `CLAUDE.md` e `.github/`: l'eccezione NON si scrive nello script; la pull request di #64 fallirà il controllo 2 e sarà accettata a mano dalle persone (da scrivere nel report).
- Test con repository git finti creati in una cartella temporanea (`mkdtemp`) con `git init`, un branch `dev` e un branch di lavoro. File: `tools/controlli-pr.test.ts` (rientra già in `vitest.config.ts`, cartella `tools/`).

## Giro 1

### T64.1 Test di accettazione · fatto
- Cosa fare: scrivere solo i test dei criteri, in `tools/controlli-pr.test.ts`, con repository git finti. Importano le funzioni da `tools/controlli-pr.mjs` (che ancora non esiste: i test possono fallire). Almeno un caso che passa e uno che fallisce per ogni controllo.
- File e cartelle: `tools/controlli-pr.test.ts`.
- Criteri di accettazione: ogni caso sotto c'è nel file, e ogni messaggio d'errore atteso contiene il percorso del file coinvolto e testo in italiano.
- Test:
  - Controllo 2: passa se il branch tocca solo `src/x.ts`; fallisce se tocca `CLAUDE.md`, e separatamente `.claude/agents/revisore.md`, `docs/METODO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, `.github/workflows/a.yml`, `docs/BRIEF.md` (un caso con più file di processo, un errore per file).
  - Controllo 3: branch `f4udor/5-prova` con commit `#5 T5.1 test di accettazione` che aggiunge `src/a.test.ts`. Passa se i commit successivi non lo toccano. Fallisce se un commit successivo lo modifica. Passa se lo modifica ma il `DIARIO.md` sotto "Decisioni da confermare" nomina `src/a.test.ts`. Passa se non esiste nessun commit `#5 T5.1`.
  - Controllo 4: passa con le righe `T5.1 · APPROVATO ... revisore: APPROVATO`, `T5.2 ... revisore: RESPINTO` e una riga `T5.3 Report ...` senza verdetto. Fallisce con la riga `T5.2 ... fatto` senza verdetto (errore con `docs/lavori/5-prova/DIARIO.md` e `T5.2`). Fallisce anche se `DIARIO.md` manca.
  - Controllo 5: passa aggiungendo `supabase/migrations/20260101000099_nuova.sql` e `supabase/aggiornamento-9.sql` con `alter table x add column y text;`. Fallisce se si modifica `supabase/migrations/20260101000001_tabelle_utente.sql`; fallisce se lo si cancella. Fallisce se `aggiornamento-9.sql` contiene `DROP TABLE x;`, `drop column`, `Rename column`, `ALTER COLUMN y TYPE int`. Passa se quelle parole stanno solo in un commento `--`.
  - Riconoscimento del branch: `f4udor/docs-orientamento` → nessun errore anche con file di processo toccati; `f4udor/64-controlli` → controlli 2-5.
- Percorsi: nessuna schermata.

### T64.2 Script dei controlli · fatto
- Cosa fare: scrivere `tools/controlli-pr.mjs` come descritto nelle scelte (funzioni esportate per i controlli 2, 3, 4, 5 e `main` da riga di comando: argomenti branch e riferimento base, stampa un errore per riga, codice di uscita 1 se ce ne sono). Solo moduli di Node (`node:child_process`, `node:fs`, `node:path`). Messaggi in italiano, ognuno con il file.
- File e cartelle: `tools/controlli-pr.mjs`.
- Criteri di accettazione: i test di T64.1 passano senza essere modificati; `npm run lint`, `npm test` e `npm run build` passano; lo script non legge nulla fuori dal repository e non usa rete.
- Test: quelli di T64.1.
- Percorsi: nessuna schermata.

### T64.3 Workflow GitHub · fatto
- Cosa fare: creare `.github/workflows/controlli-pr.yml`, che parte su `pull_request` verso `dev` con tipi `opened`, `synchronize`, `reopened`, `ready_for_review`. Permessi minimi (`contents: read`). Passi: checkout con `fetch-depth: 0`; Node 22 con cache npm; `npm ci`; `npm run lint`, `npm test`, `npm run build` (controllo 1); poi, se il branch non è `<utente>/docs-<parola>`, `node tools/controlli-pr.mjs "$BRANCH" origin/dev`, con il nome del branch passato tramite variabile d'ambiente (mai inserito direttamente nel comando). Fare in modo che i controlli 2-5 girino anche se il controllo 1 fallisce, così ogni errore compare in una volta sola. Nessun segreto, nessuna azione esterna oltre a quelle ufficiali `actions/*`.
- File e cartelle: `.github/workflows/controlli-pr.yml`.
- Criteri di accettazione: il file è YAML valido; niente `secrets.`; niente servizi esterni; versione di Node uguale a quella delle scelte; `npm run lint` e `npm test` passano. Verifica reale su GitHub: non possibile nella sessione, da scrivere in "Non verificato".
- Test: un test separato `tools/workflow-controlli.test.ts` (senza toccare quelli di T64.1) che legge il file e controlla: presenza di `pull_request`, `branches: [dev]`, i quattro tipi, assenza di `secrets.`, presenza di `node-version: 22`.
- Percorsi: nessuna schermata.

### T64.4 Regola nel CLAUDE.md · da fare
- Cosa fare: in `CLAUDE.md`, sezione "Cartella del lavoro", nella riga di `DIARIO.md`, aggiungere che ogni riga di task chiuso riporta il verdetto del revisore nel formato `revisore: APPROVATO` o `revisore: RESPINTO` (escluso il task del report). Nessun'altra modifica.
- File e cartelle: `CLAUDE.md`.
- Criteri di accettazione: il diff di `CLAUDE.md` è di una sola riga cambiata; il formato scritto coincide con quello cercato dallo script.
- Test: nessuno oltre a lint, test, build.
- Percorsi: nessuna schermata.

### T64.5 Report · da fare
Scrivi `REPORT.md` come dice `CLAUDE.md`, "Fine del lavoro". Includi: la pull request di questo lavoro tocca `CLAUDE.md` e `.github/` per autorizzazione dell'issue, quindi il controllo 2 la segnalerà (atteso); la verifica del workflow su GitHub resta da fare alla prima pull request.
