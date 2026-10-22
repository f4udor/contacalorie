# Report #50 Icona diversa per le versioni di prova

## In parole semplici
Sulla Home dell'iPhone ora si riconosce la versione: l'app vera resta blu "Personal Health", la versione comune di prova (`dev`) ha l'icona gialla e il nome "PH Dev", le anteprime dei lavori hanno l'icona rossa e il nome "PH Prova". Il nome cambia anche nel titolo della scheda del browser. Dentro l'app non cambia nulla. Nessun SQL da eseguire.

Come provare: aprire l'anteprima di questa pull request, aggiungerla alla Home dell'iPhone (togliere prima eventuali versioni vecchie): deve comparire l'icona rossa "PH Prova". Serve che su Vercel sia attivo "Enable access to System Environment Variables", altrimenti tutte le versioni si mostrano come l'app vera.

## Tecnica
- Task: T50.1 (test), T50.2 (codice), T50.3 (report): tutti `fatto`, nessuno bloccato.
- Funzione pura `sceglieVersione` in `src/app/lib/versione.ts`, 5 test nuovi; suite intera 1033 test, lint e build passano.
- Icone generate da `tools/build-icons.mjs` (`npm run icone`) in `public/icone/`.
- Decisioni da confermare e cose non verificate: vedi `DIARIO.md` (sharp non dichiarato; Home dell'iPhone non verificata).
