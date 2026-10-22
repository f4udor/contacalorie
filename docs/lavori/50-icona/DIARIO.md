# Diario #50

- T50.1 · approvato (test scritti prima del codice; stessi test passano in T50.2).
- T50.2 · approvato dal revisore. Lint, 1033 test e build passano; build con `VERCEL_ENV=preview` controllata (titolo, manifest, icone).
- T50.3 · report scritto.

## Decisioni da confermare
- `tools/build-icons.mjs` usa `sharp`, presente solo come dipendenza di Next e non dichiarata in `package.json`. Serve solo a rigenerare le icone a mano (`npm run icone`).
- Il pianificatore non è stato avviato come subagente: il piano è stato scritto dalla sessione (lavoro piccolo, nessuna domanda di prodotto).

## Non verificato
- Icona e nome sulla Home dell'iPhone e su Vercel: verificati solo con build locale e variabili simulate. Su Vercel deve essere attivo "Enable access to System Environment Variables".
