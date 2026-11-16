# Regole per le sessioni di Claude Code

Valgono per ogni prodotto. Nel prodotto questo testo vive in `CLAUDE.md` (copia da `hustle/pipeline/07-dev/SESSIONI.md`, da non modificare a mano). Tutto ciò che dipende dal prodotto sta in `docs/DEV-PRODOTTO.md`: leggilo per primo.

Chi lavora sul prodotto non scrive codice e giudica solo comportamento e schermate; il codice lo scrive solo Claude Code. Ogni lavoro nasce da un'issue di GitHub. Lavora in autonomia, senza chiedere conferme: di solito nessuno sta guardando. Quando serve una persona lo scrivi su GitHub con un'etichetta `per-…` (vedi "GitHub").

## Sessione su un'issue

Ogni sessione lavora su una sola issue, indicata nel messaggio di avvio.

1. **Regole aggiornate.** Lavora a partire da `dev` (`git fetch origin dev`). Se all'avvio il repository era su un altro branch, rileggi questo file e `docs/DEV-PRODOTTO.md` dalla versione di `dev`: vale quella.
2. **Leggi** l'issue con tutti i commenti e, se esiste, la cartella del lavoro `docs/lavori/<n>-<parola>/`. Delle specifiche (vedi `DEV-PRODOTTO.md`, sezione Specifiche) leggi i titoli e per intero solo le sezioni che l'issue o i task nominano.
3. **Branch.** Il responsabile è l'assegnatario dell'issue. Se esiste già un branch `<responsabile>/<n>-*` continui su quello; altrimenti lo crei da `dev` con il nome `<responsabile>/<n>-<parola>`. Se l'ambiente impone un altro nome, usa quello e scrivilo nel report.
4. **Piano.** Avvia il subagente `pianificatore` passandogli il numero dell'issue e il nome del branch. Scrive i task o li aggiorna dopo nuovi commenti. Se risponde `DOMANDA` o `TROPPO GRANDE`, salva e invia ciò che ha scritto, poi fermati (vedi "Fermarsi").
5. **Task.** Esegui i task `da fare` in ordine con il ciclo qui sotto. Non rifare task `fatto` e non fare nulla che i task non chiedono.
6. **Fine.** Come dice "Fine del lavoro".

Se un subagente (`pianificatore`, `collaudatore-test`, `revisore`) non è disponibile, avvia un agente `general-purpose` passandogli come istruzioni il contenuto integrale del suo file, più ciò che gli passeresti. Vale a tutti gli effetti.

## Prima i test, poi il codice

- Il primo task di ogni lavoro con logica da verificare è "Test di accettazione": **non lo scrivi tu**. Avvia il subagente `collaudatore-test` in modo SCRIVI, passandogli il numero dell'issue, il branch e il testo del task. Scrive solo i test dei criteri di accettazione, con i numeri dell'issue o delle specifiche, senza vedere il codice che li dovrà superare. In quel momento possono fallire. Poi il task passa dalla revisione come gli altri. I "Casi non decisi" che il collaudatore elenca li tratti come dice "Limiti".
- I task successivi devono farli passare **senza modificarli**. Se un test non passa e pensi che sia sbagliato o che manchi un caso, avvia il `collaudatore-test` in modo CONSULTA, passandogli solo la domanda, il percorso del test e l'esito dei test, non il tuo ragionamento né il tuo codice. Un giro solo per domanda. Secondo l'esito:
  - `TEST CORRETTO`: adatti il codice.
  - `TEST CORRETTO, ECCO LA MODIFICA` o `CASO MANCANTE, AGGIUNTO`: il collaudatore ha già cambiato il test; scrivi una riga nel diario sotto "Risolte dal collaudatore" e prosegui.
  - `NESSUN DOCUMENTO LO DECIDE`: scrivi la scelta nel diario sotto "Decisioni da confermare" con il tipo `[prodotto]` e prosegui con il default proposto (o ti fermi, se il caso è grande).
- Per i task con schermate valgono anche i **percorsi** descritti in `DEV-PRODOTTO.md`, sezione Interfaccia: i percorsi base si lanciano in ogni lavoro con schermate e devono passare.

## Ciclo di un task

1. **Costruisci** solo ciò che il task chiede, rispettando le regole di architettura di `DEV-PRODOTTO.md`.
2. **Verifica** con i comandi della sezione Verifica: devono passare tutti.
3. **Revisione**: avvia il subagente `revisore` passandogli solo il testo del task e il diff. Il revisore non vede il tuo ragionamento.
4. **Esito**:
   - approvato: commit, stato del task a `fatto`, una riga nel diario;
   - respinto: correggi seguendo le note e ripeti dal punto 2;
   - respinto due volte: stato `bloccato`, motivo nel diario, passa al task successivo.
5. Un commit per task, con issue e codice del task nel messaggio (es. `#31 T31.2 schermata Trend`).
6. **Push dopo ogni commit.** Anche un task `bloccato` va salvato e inviato: la sessione può interrompersi in qualsiasi momento.

## Cartella del lavoro

`docs/lavori/<n>-<parola>/`, una per issue. Le sessioni scrivono solo nella cartella del proprio lavoro.

- **`TASKS.md`**: lo scrive il pianificatore. Stati: `da fare`, `fatto`, `bloccato`. La sessione cambia solo gli stati.
- **`DIARIO.md`**: una riga per task chiuso (codice, esito, eventuale nota, verdetto del revisore `revisore: APPROVATO` o `revisore: RESPINTO`; escluso il task del report). In fondo tre elenchi sempre aggiornati:
  - "Decisioni da confermare": solo ciò che spetta alle persone, con il tipo `[prodotto]` (scelta che nessun documento decide) o `[brief]` (caso che le specifiche potevano prevedere e non prevedono del tutto);
  - "Risolte dal collaudatore": una riga per ogni dubbio sui test chiuso dal `collaudatore-test` (cosa, esito, riga citata, tipo `[test]` o `[brief]`). Non richiedono azione: servono a vedere cosa si ripete;
  - "Non verificato".
  Niente racconto del lavoro.
- **`REPORT.md`**: a fine lavoro.

## GitHub

- **Scrivere** (issue, etichette, commenti, pull request): con lo strumento GitHub integrato della sessione. Con `gh api` solo letture, tramite l'API REST.
- **Etichette `per-<persona>`**: le metti quando serve un'azione di quella persona, sempre con un commento che dice in una o due frasi cosa deve fare. **Prima l'etichetta, poi il commento**: le notifiche arrivano dal commento, e solo se l'etichetta c'è già.
- **Mai unire una pull request**, mai approvarne una, mai scrivere su `dev` o su `main`. Le pull request vanno sempre verso `dev`.

## Database

(Se il prodotto ha un database; le regole esatte stanno in `DEV-PRODOTTO.md`, sezione Dati.)

- Nessun agente esegue SQL su un database vero, nemmeno di prova: lo fa una persona.
- Ogni migrazione è un file nuovo con il numero successivo all'ultimo presente in `dev`; se, portando dentro `dev`, trovi lo stesso numero, rinumera il tuo. Mai modificare migrazioni esistenti.

## Fine del lavoro

Quando tutti i task sono `fatto` o `bloccato`:

1. **Porta dentro `dev`** (merge) e rilancia i comandi di verifica. Conflitti negli screenshot: rigenerali. Conflitti sul codice: non scegliere tu, fermati (vedi "Fermarsi").
2. **Scrivi `REPORT.md`** in tre parti:
   - **In parole semplici**: cosa c'è ora, cosa si può provare e come (un controllo per ogni task), cosa manca, se c'è un SQL da eseguire.
   - **Prove di collaudo**: 2-5 prove d'insieme da fare su `dev`, numerate, ognuna "fai così → devi vedere questo".
   - **Tecnica**: task chiusi e bloccati, copertura dei test, decisioni da confermare, quante cose ha chiuso il collaudatore, limiti e cose non verificate.
3. **Pull request** verso `dev`, **in bozza** (o aggiorna quella che esiste). Titolo `#<n> <titolo dell'issue>`; nel testo la parte "In parole semplici" e la riga `Closes #<n>`.
4. **Etichette sulla pull request**: sempre `per-<responsabile>`, con il commento "Lavoro finito. Segna la pull request come pronta (Ready for review), oppure chiedilo alla tua chat: parte la valutazione con le prove da fare."; se c'è un file SQL, anche `sql-da-eseguire` e `per-<chi esegue gli SQL>`, con il commento che nomina il file.
5. Fermati.

## Imprevisti

Quando succede qualcosa che una persona deve sapere (la sessione non riesce a finire, un conflitto), lo scrivi su GitHub: **prima l'etichetta `per-…` della persona che deve agire, poi il commento**, sempre in questa forma:

```
⚠️ Imprevisto: <cosa è successo, in una frase>
Cosa puoi fare: <azioni, numerate, con il testo esatto da usare se serve>
Se non fai nulla: <cosa succede>
```

Quando un imprevisto si risolve, chi se ne accorge scrive `✅ Risolto: <cosa è successo>. Nessuna azione da fare.` e toglie le etichette `per-…` messe solo per quell'avviso.

## Fermarsi

Quando non puoi andare avanti (domanda del pianificatore, lavoro troppo grande, conflitto sul codice, errore che non riesci a risolvere):
- salva e invia tutto ciò che è fatto;
- sull'issue metti `domanda` (serve una scelta di prodotto) oppure `bloccata` (negli altri casi), più `per-<responsabile>`;
- scrivi un commento: cosa è successo e cosa serve, in parole semplici; le domande sono numerate e ognuna ha una proposta di default.

## Limiti

- Lavora solo dentro il repository. Nessuna chiave, nessun servizio reale, nessun dato personale: i servizi esterni sono simulati con finti locali.
- Non prendere decisioni di prodotto. Se un caso piccolo non è coperto (non cambia numeri né cosa si vede sullo schermo), scegli l'opzione più semplice, scrivila nel diario sotto "Decisioni da confermare" e prosegui. Se è grande, è una domanda: fermati.
- Non aggiungere funzioni non richieste, nemmeno se sembrano utili.
- Non toccare i file di processo elencati in `DEV-PRODOTTO.md` né le specifiche del prodotto, salvo che l'issue lo chieda esplicitamente.
- Se una verifica non si può fare nell'ambiente, dichiaralo nel diario: non scrivere che funziona.
