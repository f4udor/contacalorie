# Personal Health: contratto di sviluppo

Questo file dice agli agenti generici della pipeline dev (`hustle/pipeline/07-dev/`, copie in `docs/dev/`, `CLAUDE.md` e `.claude/agents/`) tutto ciò che dipende da Personal Health. Gli agenti lo leggono all'inizio di ogni sessione. Se manca un'informazione che serve, si fermano e lo dicono.

## Persone
- Responsabili e account GitHub: Mauro → `f4udor`, Claudiu → `NIss-gif` (da cercare anche come `niss-gif`).
- Etichette `per-mauro` e `per-claudiu`.
- Chi approva l'uscita in `main`: Claudiu su GitHub; chi unisce e prepara l'uscita, esegue gli SQL sul database vero e fa il backup: Mauro.
- Il processo (questo file, `CLAUDE.md`, `.claude/`, `docs/dev/`, `docs/METODO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, le guide `docs/COLLEGA-*.md`) è di Mauro. Gli strumenti di lavoro (codice che serve solo a come si lavora, non all'app vera) hanno l'etichetta `strumenti` e li unisce Mauro da solo.

## Repository
- `f4udor/contacalorie`; branch di lavoro `dev` (predefinito), app vera `main`.

## Verifica
Comandi che devono passare prima di ogni commit e di ogni pull request:
- `npm run lint`
- `npm test`
- `npm run build`
- Screenshot delle schermate: `npm run screens` (`tools/screens.mjs`).
- Percorsi: `npm run percorsi`, script in `tests/percorsi/`, screenshot in `docs/screenshots/percorsi/<nome>/`. Percorsi base: accesso, aggiungere un pasto, aprire Trend, aprire Impostazioni. Se lo script o i percorsi base non esistono ancora, il primo lavoro con schermate li crea in un suo task.
- Controllo automatico delle pull request: `.github/workflows/controlli-pr.yml` (lint, test, build, più `tools/controlli-pr.mjs`).

## Architettura
Stack: Next.js (App Router) con TypeScript strict, Tailwind CSS, Supabase (Postgres e login), Vitest per la logica, Playwright per gli screenshot. Nessuna altra dipendenza senza un motivo scritto nel diario del lavoro.

```
src/engine/      motore dei calcoli: funzioni pure, nessun import da UI, database o rete
src/modules/     un modulo per funzione: meals, activity, weight, challenge, ai, reminders
src/data/        sportello dei dati: unica interfaccia per leggere e scrivere (browser e Supabase)
src/app/         schermate e route
supabase/migrations/   schema del database
docs/            specifiche, lavori, archivio, guide
```

Regole che revisore e valutatore controllano:
- `src/engine` non importa nulla dal resto del progetto e non legge data, ora o rete: riceve tutto come parametri.
- Un modulo non importa da un altro modulo: se devono parlarsi, passano dal motore o da tipi condivisi.
- Le schermate leggono e scrivono solo tramite `src/data`. Nessun altro file tocca `localStorage` o il database.
- Ogni chiamata al modello AI passa da `src/modules/ai` tramite l'interfaccia unica `AiProvider`. Nessun altro file conosce Gemini.
- Nessun numero di regola scritto nel codice delle schermate: le costanti stanno nelle impostazioni, con i default in `src/engine/defaults.ts`.
- I test esistenti della logica non si cambiano per farli passare.

## Specifiche
- Regole di prodotto, numeri, casi di verifica, schermate e stile: `docs/BRIEF.md`. Quadro e principi: `docs/CONTESTO.md`. Testi dell'interfaccia: `docs/TESTI.md`.
- Nelle issue e nei task si citano come `§<numero>` del brief (es. `§2`, `§10`).
- Il prodotto si decide in due: una modifica al brief entra con una pull request su `<utente>/docs-<parola>` approvata dall'altra persona.
- Ogni idea nuova passa prima dalle domande di `docs/CONTESTO.md` §8.

## Interfaccia
- Stile: `docs/BRIEF.md` §10. Tema solo scuro su nero pieno, ispirato all'app Fitness; bozze di riferimento in `docs/design/`. Inserimenti in pannelli che salgono dal basso. Nessuna decorazione.
- Testi dell'interfaccia in italiano.
- Screenshot a 390 px di larghezza in `docs/screenshots/`.

## Dati e servizi esterni
- Database: Supabase (Postgres). Il database cresce per aggiunte: nuove tabelle e nuove colonne, mai rinominare né eliminare. Ogni migrazione nuova è un file nuovo in `supabase/migrations/` con il numero successivo all'ultimo in `dev`; mai modificare migrazioni esistenti. Ogni lavoro che cambia il database ha `supabase/aggiornamento-<n>.sql` da eseguire a mano, con solo aggiunte.
- Nessun agente esegue SQL su un database vero, nemmeno di prova: sul database di prova lo esegue Mauro (o la sua chat, con il connettore Supabase); sul database vero solo Mauro.
- Servizi esterni: Supabase, Gemini (modello AI), email. Nelle sessioni sono simulati con finti locali: nessuna chiave, nessun servizio reale, nessun dato personale. Le anteprime usano il database di prova e Gemini vero con un limite basso.
- Al modello AI va solo il testo del pasto con data e ora. Mandare altri dati fuori dall'app è una decisione esplicita di Mauro.

## Soglie
- Massimo 8 task per lavoro, report compreso.

## File di processo
Le sessioni non li toccano salvo richiesta esplicita dell'issue: `CLAUDE.md`, `.claude/`, `docs/dev/`, `docs/DEV-PRODOTTO.md`, `docs/METODO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, `.github/`, e `docs/BRIEF.md`.
`CLAUDE.md`, `.claude/agents/` e `docs/dev/` sono copie dei file in `hustle/pipeline/07-dev/`: si cambiano lì, non a mano qui.

## Anteprime e uscita
- Ogni branch ha la sua anteprima su Vercel: il link compare nei commenti della pull request. `dev` è l'app "PH Dev" (icona gialla); i branch dei lavori sono "PH Prova" (icona rossa). `main` è l'app vera, con il database vero; su Vercel il branch di produzione è `main`, impostato a mano.
- Prima di portare `dev` in `main`: backup del database vero ed esecuzione degli SQL nell'ordine indicato (solo Mauro), poi "eseguito" sulla pull request.
- Note di versione in `docs/rilasci/v0.<N>.md`; etichetta di versione `v0.<N>`; la prima uscita è `v0.1`.
- Piano di ritorno: su Vercel si torna alla versione precedente (il database cresce per aggiunte, quindi la versione vecchia funziona).
- Canali: `#mauro` e `#claudiu` ricevono su Slack le etichette `per-…` (app GitHub); `#generale` per le decisioni da prendere in due e le uscite.
