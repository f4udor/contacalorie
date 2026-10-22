# Personal Health: regole di lavoro

App per tracciare dieta e attività fisica, nata come app personale e oggi base di un prodotto da vendere (`docs/CONTESTO.md` §1). La fanno crescere due persone, Mauro (GitHub `f4udor`) e Claudiu (GitHub `NIss-gif`), che non scrivono codice e giudicano solo schermate e comportamento. Ogni lavoro nasce da un'issue di GitHub; le regole del prodotto stanno in `docs/BRIEF.md`; il metodo delle persone in `docs/METODO.md`.

Lavora in autonomia, senza chiedere conferme: di solito nessuno sta guardando. Quando serve una persona, lo scrivi su GitHub con un'etichetta `per-…` (vedi "GitHub").

## Sessione su un'issue

Ogni sessione lavora su una sola issue, indicata nel messaggio di avvio o scelta come dice "Sessione notturna".

1. **Regole aggiornate.** Lavora a partire da `dev` (`git fetch origin dev`). Se all'avvio il repository era su un altro branch, rileggi questo file dalla versione di `dev`: vale quella.
2. **Leggi** l'issue con tutti i commenti, e se esiste la cartella del lavoro `docs/lavori/<n>-<parola>/`. Di `docs/BRIEF.md` leggi i titoli delle sezioni e per intero solo le sezioni che l'issue o i task nominano. `docs/archivio/` si legge solo se un task lo richiede.
3. **Branch.** Il responsabile è l'assegnatario dell'issue. Se esiste già un branch `<responsabile>/<n>-*`, continui su quello; altrimenti lo crei da `dev` con il nome `<responsabile>/<n>-<parola>` (es. `f4udor/31-trend`). Se l'ambiente impone un altro nome, usa quello e scrivilo nel report.
4. **Piano.** Avvia il subagente `pianificatore` (`.claude/agents/pianificatore.md`) passandogli il numero dell'issue e il nome del branch. Il pianificatore scrive i task o li aggiorna dopo nuovi commenti. Se risponde `DOMANDA` o `TROPPO GRANDE`, salva e invia ciò che ha scritto, poi fermati (vedi "Fermarsi").
5. **Task.** Esegui i task `da fare` in ordine, con il ciclo qui sotto. Non rifare task `fatto` e non fare nulla che i task non chiedono.
6. **Fine.** Come dice "Fine del lavoro".

Se il subagente `pianificatore` o `revisore` non è disponibile nella sessione, avvia un agente `general-purpose` passandogli come istruzioni il contenuto integrale del suo file, più ciò che gli passeresti. Vale a tutti gli effetti.

## Sessione notturna

Quando il messaggio di avvio dice "sessione notturna per `<utente>`":

0. **Recuperi**, prima di tutto, anche se poi non c'è nessuna issue da fare:
   - **Valutazioni mancanti.** Cerca le pull request aperte verso `dev`, non in bozza, uscite dalla bozza da più di 12 ore e senza un commento "## Valutazione" più recente del loro ultimo commit (escluse quelle di processo, documenti e strumenti di `<utente>` stesso).
     - Se l'autore è l'altra persona: valutala tu, avviando il subagente `valutatore-pr` con `<utente>` come approvatore. Poi scrivi sulla pull request un commento "Recupero" come dice "Imprevisti".
     - Se l'autore è `<utente>`: non valutarla. Avvisa come dice "Imprevisti": il valutatore dell'altra persona non è partito; cosa fare: lanciare la valutazione a mano da qualunque account (testo in `docs/METODO.md`, "Imprevisti").
     - Se l'avviso c'è già, non ripeterlo.
   - **Collaudo.** Per ogni pull request unita in `dev` dall'ultimo aggiornamento, copia le "Prove di collaudo" del suo `REPORT.md` nell'issue aperta "Collaudo prossima versione" (se non c'è, creala, assegnata a tutti e due). Nel testo dell'issue tieni in alto la data di inizio del collaudo (la prima prova aggiunta). Se hai aggiunto prove, metti `per-mauro` e `per-claudiu` e un commento: "Nuove prove di collaudo per <lavori>: falle su PH Dev quando puoi e racconta l'esito alla tua chat."
   - **Sessioni interrotte.** Cerca le issue con `in-lavorazione` il cui branch non ha commit da più di 6 ore. Per ognuna avvisa il responsabile come dice "Imprevisti": la sessione si è interrotta; cosa fare: rilanciarla a mano, oppure togliere `in-lavorazione` e rimettere `pronta` per la notte dopo. Non riprenderla tu. Se l'avviso c'è già, non ripeterlo.
1. Cerca le issue aperte assegnate a `<utente>` con l'etichetta `pronta` e senza `in-lavorazione`, `domanda` o `bloccata`. Se non ce ne sono, fermati senza fare nulla.
2. Prendi la più vecchia: una sola issue per notte.
3. Sull'issue togli `pronta` e metti `in-lavorazione`.
4. Prosegui come dice "Sessione su un'issue".
5. Alla fine togli `in-lavorazione`, in ogni caso.

## Stack

- Next.js (App Router) con TypeScript in modalità strict.
- Tailwind CSS per lo stile.
- Supabase per database (Postgres) e login.
- Vitest per i test della logica, Playwright per gli screenshot delle schermate.
- Nessuna altra dipendenza senza un motivo scritto nel diario del lavoro.

## Struttura e modularità

Questa è la regola più importante del progetto: si devono poter aggiungere moduli senza toccare la logica di fondo.

```
src/engine/      motore dei calcoli: funzioni pure, nessun import da UI, database o rete
src/modules/     un modulo per funzione: meals, activity, weight, challenge, ai, reminders
src/data/        sportello dei dati: unica interfaccia per leggere e scrivere (browser e Supabase)
src/app/         schermate e route
supabase/migrations/   schema del database
docs/            brief, lavori, archivio, guide
```

- `src/engine` non importa nulla dal resto del progetto e non legge data, ora o rete: riceve tutto come parametri.
- Un modulo non importa da un altro modulo. Se due moduli devono parlarsi, passano dal motore o da tipi condivisi.
- Le schermate leggono e scrivono solo tramite `src/data`. Nessun altro file tocca `localStorage` o il database.
- Ogni chiamata al modello AI passa da `src/modules/ai` tramite un'interfaccia unica (`AiProvider`). Nessun altro file conosce Gemini.
- Il database cresce per aggiunte: nuove tabelle e nuove colonne. Mai rinominare o eliminare colonne esistenti.
- Nessun numero di regola scritto nel codice delle schermate: le costanti stanno nelle impostazioni, con i default in `src/engine/defaults.ts`.

## Prima i test, poi il codice

- Il primo task di ogni lavoro che ha logica da verificare è "Test di accettazione": scrive solo i test dei criteri di accettazione, con i numeri del task o del brief. In quel momento possono fallire. Si committa così.
- I task successivi devono farli passare **senza modificarli**. Se un test di accettazione sembra sbagliato (contraddice l'issue o il brief), puoi cambiarlo solo scrivendolo nel diario sotto "Decisioni da confermare", con la riga dell'issue o del brief che lo giustifica.
- Per i task con schermate valgono anche i **percorsi**: script Playwright che usano l'app simulata a 390 px come farebbe una persona (tocco, scrivo, confermo, torno) e salvano uno screenshot per ogni passo. Stanno in `tests/percorsi/`, si lanciano con `npm run percorsi` (sul modello di `tools/screens.mjs`), gli screenshot vanno in `docs/screenshots/percorsi/<nome>/`. I **percorsi base** (accesso, aggiungere un pasto, aprire Trend, aprire Impostazioni) si lanciano in ogni lavoro con schermate e devono passare. Se lo script o i percorsi base non esistono ancora, il primo lavoro con schermate li crea in un suo task.

## Ciclo di un task

1. **Costruisci** solo ciò che il task chiede.
2. **Verifica**: `npm run lint`, `npm test`, `npm run build` devono passare.
3. **Revisione**: avvia il subagente `revisore` (`.claude/agents/revisore.md`), passandogli solo il testo del task e il diff. Il revisore non vede il tuo ragionamento.
4. **Esito**:
   - approvato: commit, stato del task a `fatto`, una riga nel diario del lavoro;
   - respinto: correggi seguendo le note e ripeti dal punto 2;
   - respinto due volte: stato `bloccato`, motivo nel diario, passa al task successivo.
5. Un commit per task, con issue e codice del task nel messaggio (es. `#31 T31.2 schermata Trend`).
6. **Push dopo ogni commit.** Anche un task `bloccato` va salvato e inviato. Nessun lavoro deve restare solo nell'ambiente della sessione: la sessione può interrompersi in qualsiasi momento.

## Cartella del lavoro

`docs/lavori/<n>-<parola>/`, una per issue. Le sessioni scrivono solo nella cartella del proprio lavoro.

- **`TASKS.md`**: lo scrive il pianificatore (formato nel suo file). Stati: `da fare`, `fatto`, `bloccato`. La sessione cambia solo gli stati.
- **`DIARIO.md`**: una riga per task chiuso (codice, esito, eventuale nota, verdetto del revisore nel formato `revisore: APPROVATO` o `revisore: RESPINTO`; escluso il task del report). In fondo due elenchi sempre aggiornati: "Decisioni da confermare" e "Non verificato". Niente racconto del lavoro.
- **`REPORT.md`**: a fine lavoro (vedi sotto).

## GitHub

- **Scrivere** (issue, etichette, commenti, pull request, bozza o pronta): usa lo strumento GitHub integrato della sessione. Con `gh api` solo letture, tramite l'API REST (GraphQL non è disponibile).
- **Etichette `per-mauro` e `per-claudiu`**: le metti quando serve un'azione di quella persona, sempre con un commento che dice in una o due frasi cosa deve fare. **Prima l'etichetta, poi il commento**: su Slack arriva il commento, e solo se l'etichetta c'è già.
- **Mai unire una pull request**, mai approvarne una, mai scrivere su `dev` o su `main`. Le pull request vanno sempre verso `dev`.

## Database

- Ogni migrazione nuova è un file nuovo in `supabase/migrations/` con il numero successivo all'ultimo presente in `dev`. Se, portando dentro `dev`, trovi un file con lo stesso numero, rinumera il tuo. Mai modificare migrazioni esistenti.
- Ogni lavoro che cambia il database ha un file `supabase/aggiornamento-<n>.sql` da eseguire a mano, con solo aggiunte.
- Nessun agente esegue SQL su un database vero, nemmeno di prova: lo fa Mauro.

## Fine del lavoro

Quando tutti i task sono `fatto` o `bloccato`:

1. **Porta dentro `dev`** (merge) e rilancia `npm run lint`, `npm test` e `npm run build`.
   - Conflitti negli screenshot: rigenerali.
   - Conflitti sul codice: non scegliere tu. Fermati (vedi "Fermarsi").
2. **Scrivi `REPORT.md`**, in due parti:
   - **In parole semplici**: cosa c'è ora, cosa si può provare e come (un controllo sul telefono per ogni task), cosa manca, se c'è un SQL da eseguire.
   - **Prove di collaudo**: 2-5 prove da fare su `dev` prima dell'uscita, d'insieme (la funzione nuova insieme al resto dell'app), numerate, ognuna "fai così → devi vedere questo".
   - **Tecnica**: task chiusi e bloccati, copertura dei test, decisioni da confermare, limiti e cose non verificate.
3. **Pull request** verso `dev`, **in bozza**, o aggiorna quella che esiste già. Titolo `#<n> <titolo dell'issue>`; nel testo la parte "In parole semplici" del report e la riga `Closes #<n>`.
4. **Etichette sulla pull request**:
   - sempre `per-<responsabile>`, con il commento "Lavoro finito. Segna la pull request come pronta (Ready for review), oppure chiedilo alla tua chat: parte la valutazione con le prove da fare.";
   - se c'è un file SQL, anche `sql-da-eseguire` e `per-mauro`, con il commento che nomina il file da eseguire sul database di prova.
5. Fermati.

## Imprevisti

Quando succede qualcosa che una persona deve sapere (valutazione non partita, sessione interrotta, recupero fatto), lo scrivi su GitHub perché arrivi su Slack: **prima l'etichetta `per-…` della persona che deve agire, poi il commento**. Se nessuno deve agire, l'etichetta va a chi deve solo sapere.

Il commento di avviso ha sempre questa forma:

```
⚠️ Imprevisto: <cosa è successo, in una frase>
Cosa puoi fare: <azioni, numerate, con il testo esatto da usare se serve>
Se non fai nulla: <cosa succede>
```

Quando un imprevisto si risolve (il valutatore parte in ritardo, un recupero lo sistema, una sessione rilanciata va avanti), chi se ne accorge scrive sullo stesso posto:

```
✅ Risolto: <cosa è successo>. Nessuna azione da fare.
```

e toglie le etichette `per-…` messe solo per quell'avviso.

Il commento "Recupero" dopo una valutazione fatta dalla sessione notturna: `✅ Risolto: il valutatore non era partito, la valutazione l'ha fatta la sessione notturna di <utente>. Nessuna azione in più oltre a quelle della valutazione.`

## Fermarsi

Quando non puoi andare avanti (domanda del pianificatore, lavoro troppo grande, conflitto sul codice, errore che non riesci a risolvere):
- salva e invia tutto ciò che è fatto;
- sull'issue metti `domanda` (se serve una scelta di prodotto) oppure `bloccata` (negli altri casi), più `per-<responsabile>`;
- scrivi un commento sull'issue: cosa è successo e cosa serve, in parole semplici. Le domande sono numerate e ognuna ha una proposta di default.

## Limiti

- Lavora solo dentro il repository.
- Nessuna chiave, nessun servizio reale, nessun dato personale: Supabase, modello AI ed email sono simulati con finti locali.
- Non prendere decisioni di prodotto. Se un caso piccolo non è coperto (non cambia numeri né cosa si vede sullo schermo), scegli l'opzione più semplice, scrivila nel diario sotto "Decisioni da confermare" e prosegui. Se è grande, è una domanda: fermati.
- Non aggiungere funzioni non richieste, nemmeno se sembrano utili.
- Non toccare file di processo (`CLAUDE.md`, `.claude/`, `docs/METODO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`) né `docs/BRIEF.md`, salvo che l'issue lo chieda esplicitamente.
- Se una verifica non si può fare nell'ambiente, dichiaralo nel diario: non scrivere che funziona.

## Stile dell'interfaccia

Vale `docs/BRIEF.md` §10: tema solo scuro su nero pieno, ispirato all'app Fitness, con le bozze di riferimento in `docs/design/`. Inserimenti in pannelli che salgono dal basso. Nessuna decorazione. Testi dell'interfaccia in italiano. Screenshot a 390 px di larghezza in `docs/screenshots/`.
