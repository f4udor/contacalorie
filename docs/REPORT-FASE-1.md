# Report fase 1: motore dei calcoli e schema del database

## 1. In parole semplici

**Cosa c'è ora.** Il "cervello" dell'app è pronto e testato. Sa calcolare:
- quante kcal contano davvero i pasti di un giorno (con il tetto sul pasto libero);
- i bonus per bici e passi;
- l'obiettivo di ogni giorno, con il recupero dei giorni in cui si è mangiato troppo, senza mai scendere sotto la soglia minima;
- i grammi di proteine, carboidrati, grassi, fibre e sale;
- i colori dei semafori e dell'anello delle kcal;
- il riepilogo della settimana, lunedì-domenica;
- gli esercizi della sfida mattutina per ogni giorno.

Tutti i casi A-J del brief (§3.6) escono con i numeri esatti. Esiste anche il progetto vuoto (la pagina iniziale mostra solo "Personal Health") e il disegno del database: dieci tabelle, ognuna visibile solo al proprio utente, con il piano di 30 giorni già dentro.

**Cosa si può provare.** Non ci sono schermate, quindi non c'è nulla da guardare nel telefono. Si può solo rilanciare i controlli: `npm test` (109 test), `npm run lint`, `npm run build`.

**Cosa manca.**
- Il task T1.0 (impalcatura) era rimasto bloccato per un buco nella regola che impedisce al motore di importare da fuori (`./../app/page` passava). Il buco è stato chiuso dopo la fase con la correzione indicata dal revisore: ora tutti gli 11 task sono chiusi.
- Il database non è stato provato su Supabase vero, solo su un database locale che lo imita.
- Nessuna schermata, nessun collegamento reale a Supabase o all'AI: sono le fasi successive.

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T1.0 Impalcatura | fatto: respinto due volte (buco `./../` nella regola di lint), chiuso dopo la fase con la correzione del revisore |
| T1.1 Tipi e impostazioni | fatto |
| T1.2 Kcal nel budget | fatto |
| T1.3 Bonus attività | fatto |
| T1.4 Obiettivo del giorno | fatto |
| T1.5 Nutrienti | fatto |
| T1.6 Semafori | fatto |
| T1.7 Riepilogo settimana | fatto |
| T1.8 Piano della sfida | fatto |
| T1.9 Schema del database | fatto |
| T1.10 Report | questo file |

Un commit per task, ognuno inviato al ramo `claude/compassionate-heisenberg-w05am7`; i commit "in attesa di revisione" precedono quelli di chiusura.

**Processo.** Il subagente `revisore` non era caricabile nella sessione (creato durante la sessione stessa). Su autorizzazione dell'utente, ora scritta in `CLAUDE.md`, ogni revisione è stata fatta da un agente `general-purpose` con le istruzioni di `.claude/agents/revisore.md`, il testo del task e il diff. T1.1-T1.9 approvati al primo giro; T1.0 respinto due volte, quindi `bloccato` come da regola.

### Test
- 109 test in 10 file (Vitest), tutti verdi; `lint` e `build` passano.
- Casi di §3.6: A, B, C, D, H (`target.test.ts`), E, F (`activity.test.ts`, `target.test.ts`, `nutrients.test.ts`), G (`nutrients.test.ts`), I, J (`traffic.test.ts`), sfida giorni 1, 4, 6, 30 (`challenge.test.ts`).
- Confini esatti di ogni soglia dei semafori; obiettivo 0 → neutro; settimana vuota → `null`; ora legale e anni bisestili per le date.
- La percentuale di copertura **non è stata misurata** (nessuno strumento installato; richiederebbe una dipendenza non motivata dal brief).
- `src/engine` è puro: importa solo da se stesso, non legge data, ora o rete. Le costanti sono in `defaults.ts`. L'unico test di T1.4 toccato più tardi (`dates.test.ts`) ha avuto solo un'aggiunta in T1.8.

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali:
- carboidrati arrotondati al grammo;
- soglia gialla dell'anello (×1,05) come costante, non come impostazione;
- sale esattamente al tetto → giallo;
- il giorno stesso non entra nel proprio saldo; nel riepilogo settimana il saldo include tutti i giorni con pasti;
- media kcal sulle kcal reali, passi a 0 trattati come assenti;
- piano della sfida come piano di sistema (`user_id` nullo) scelto da `settings`;
- il limite di un pasto libero a settimana è controllato dall'app, non dal database.

### Limiti e non verificato
- T1.0: `require()` e `import()` dinamici non coperti dalla regola di lint. Il buco `./../` è chiuso (regex `^(?!\./[A-Za-z0-9_-]+$)`, tre casi di test in `tools/lint-engine.test.ts`).
- T1.9: migrazioni provate su PostgreSQL 16 locale con stand-in di `auth.users`, `auth.uid()` e del ruolo `authenticated`. Non provato su Supabase: `auth.uid()` reale, grant dei ruoli, accesso con il vero login.
- Nessuna schermata in questa fase: nessuno screenshot.
