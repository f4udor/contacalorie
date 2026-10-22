# #50 Icona diversa per le versioni di prova

Issue: #50 · Responsabile: f4udor · Branch: f4udor/50-icona
Obiettivo: icona e nome dell'app cambiano tra `main` (blu, "Personal Health"), `dev` (gialla, "PH Dev") e anteprime (rossa, "PH Prova").
Sezioni del brief: nessuna (strumento di lavoro)
Vincoli: nessun database; nessuna modifica a colori o testi dentro l'app.

## Scelte del pianificatore
- Pianificazione scritta dalla sessione stessa (lavoro piccolo, nessuna domanda di prodotto).
- La funzione pura sta in `src/app/lib/versione.ts` (non nel motore: non è un calcolo dell'app).
- Icone di prova in `public/icone/`, generate da `tools/build-icons.mjs` (`npm run icone`) dalle icone blu; `sharp` è già presente come dipendenza di Next, nessuna dipendenza nuova.
- `src/app/apple-icon.png` e `icon.png` restano quelli blu: per le versioni di prova `metadata.icons` li sostituisce.

## Giro 1

### T50.1 Test di accettazione · da fare
- Test di `sceglieVersione(env, branch)`: `production` → principale; `preview` + `dev` → dev; `preview` + altro branch → prova; variabili assenti → principale. Più test su nome e icone di ogni versione.
- File: `src/app/lib/versione.test.ts`.

### T50.2 Versione, manifest, titolo e icone · da fare
- Funzione pura, manifest e layout che la usano (titolo browser, `appleWebApp.title`, icone), icone gialla e rossa.
- File: `src/app/lib/versione.ts`, `src/app/manifest.ts`, `src/app/layout.tsx`, `public/icone/`, `tools/build-icons.mjs`, `package.json`.
- Criteri: quelli dell'issue #50, uno per uno; lint, test e build passano.

### T50.3 Report · da fare
Scrivi `REPORT.md` come dice `CLAUDE.md`, "Fine del lavoro".
