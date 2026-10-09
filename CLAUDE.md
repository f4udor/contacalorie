# Personal Health: regole di lavoro

App personale per tracciare dieta e attività fisica. Un solo utente, che non scrive codice e giudica solo schermate e comportamento. Cosa costruire è in `docs/BRIEF.md`; in che ordine è in `docs/TASKS.md`.

## Prima di ogni sessione

1. Leggi `docs/BRIEF.md`, `docs/TASKS.md` e `docs/DIARIO.md`.
2. Riparti dal primo task con stato `da fare`. Non rifare task `fatto`.
3. Lavora solo sui task della fase indicata. Non anticipare fasi successive.

## Stack

- Next.js (App Router) con TypeScript in modalità strict.
- Tailwind CSS per lo stile.
- Supabase per database (Postgres) e login.
- Vitest per i test della logica, Playwright per gli screenshot delle schermate.
- Nessuna altra dipendenza senza un motivo scritto nel diario.

## Struttura e modularità

Questa è la regola più importante del progetto: si devono poter aggiungere moduli senza toccare la logica di fondo.

```
src/engine/      motore dei calcoli: funzioni pure, nessun import da UI, database o rete
src/modules/     un modulo per funzione: meals, activity, weight, challenge, ai, reminders
src/data/        sportello dei dati: unica interfaccia per leggere e scrivere (browser oggi, Supabase poi)
src/app/         schermate e route
supabase/migrations/   schema del database
docs/            brief, task, diario
```

- `src/engine` non importa nulla dal resto del progetto e non legge data, ora o rete: riceve tutto come parametri.
- Un modulo non importa da un altro modulo. Se due moduli devono parlarsi, passano dal motore o da tipi condivisi.
- Le schermate leggono e scrivono solo tramite `src/data`. Nessun altro file tocca `localStorage` o il database.
- Ogni chiamata al modello AI passa da `src/modules/ai` tramite un'interfaccia unica (`AiProvider`). Nessun altro file conosce Gemini.
- Il database cresce per aggiunte: nuove tabelle e nuove colonne. Mai rinominare o eliminare colonne esistenti.
- Nessun numero di regola scritto nel codice delle schermate: le costanti stanno nelle impostazioni, con i default in `src/engine/defaults.ts`.

## Ciclo di lavoro

Per ogni task:

1. **Costruisci** solo ciò che il task chiede.
2. **Verifica**: `npm run lint`, `npm test`, `npm run build` devono passare.
3. **Revisione**: avvia il subagente `revisore` (definito in `.claude/agents/revisore.md`), passandogli solo il testo del task e il diff. Il revisore non vede il tuo ragionamento.
   Se il subagente `revisore` non è disponibile nella sessione, avvia un agente `general-purpose` passandogli come istruzioni il contenuto integrale di `.claude/agents/revisore.md`, più il testo del task e il diff. Vale come revisione a tutti gli effetti.
4. **Esito**:
   - approvato: commit, stato del task a `fatto`, una riga nel diario;
   - respinto: correggi seguendo le note e ripeti dal punto 2;
   - respinto due volte: stato `bloccato`, motivo nel diario, passa al task successivo.
5. Un commit per task, con il codice del task nel messaggio (es. `T1.4 target del giorno`).
6. **Push dopo ogni commit**, sul ramo della sessione. Anche un task `bloccato` va salvato e inviato: aggiornamento di `docs/TASKS.md` e del diario in un commit a parte. Nessun lavoro deve restare solo nell'ambiente della sessione.

Lavora in autonomia, senza chiedere conferme all'utente: nessuno sta guardando. Se serve una scelta, applica la regola dei "Limiti" qui sotto e prosegui.

### Cosa controlla il revisore

- I criteri di accettazione del task sono soddisfatti, uno per uno.
- I test passano e coprono i casi elencati nel task.
- Nessun file fuori dal modulo del task è stato modificato senza motivo.
- `src/engine` è rimasto puro e i suoi test esistenti non sono stati cambiati per farli passare.
- Per i task con schermate: screenshot a 390 px di larghezza (tema chiaro e scuro fino alla fase 5c; dalla fase 6 solo scuro), senza testo tagliato, sovrapposizioni o scorrimento orizzontale.

## Limiti

- Lavora solo dentro il repository.
- Nessuna chiave, nessun servizio reale, nessun dato personale: Supabase, modello AI ed email sono simulati con finti locali finché l'utente non collega quelli veri.
- Non prendere decisioni di prodotto. Se il brief non copre un caso, scegli l'opzione più semplice, scrivila nel diario sotto "Decisioni da confermare" e prosegui.
- Non aggiungere funzioni non richieste, nemmeno se sembrano utili.
- Se una verifica non si può fare nell'ambiente, dichiaralo nel diario: non scrivere che funziona.

## Diario (`docs/DIARIO.md`)

Una riga per task chiuso: codice, esito, eventuale nota. In fondo due elenchi, sempre aggiornati: "Decisioni da confermare" e "Non verificato". Niente racconto del lavoro.

## Fine fase

Quando tutti i task della fase sono `fatto` o `bloccato`, scrivi `docs/REPORT-FASE-N.md` e fermati. Il report ha due parti:

1. **In parole semplici**: cosa c'è ora, cosa si può provare e come, cosa manca.
2. **Tecnica**: task chiusi e bloccati, copertura dei test, decisioni da confermare, limiti e cose non verificate.

## Stile dell'interfaccia

Fino alla fase 5c: struttura chiara come l'app Salute di Apple, anelli come Fitness, font di sistema, schede arrotondate su sfondo neutro, tema chiaro e scuro automatici, un solo colore d'accento più verde, giallo e rosso per i semafori.

Dalla fase 6 vale `docs/BRIEF.md` §10: tema solo scuro su nero pieno, ispirato all'app Fitness, con la bozza di riferimento in `docs/design/`. Inserimenti in pannelli che salgono dal basso. Nessuna decorazione. Testi dell'interfaccia in italiano.
