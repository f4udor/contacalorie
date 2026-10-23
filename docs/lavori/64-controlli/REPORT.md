# #64 Controllo automatico sulle pull request verso dev

## In parole semplici
Ogni pull request verso `dev` viene ora controllata da GitHub da sola: accanto alla pull request compare una spunta verde o una croce rossa, anche dall'app GitHub sul telefono. Se qualcosa non va, il passo fallito mostra una riga in italiano con il file coinvolto.

Cosa controlla:
1. Lint, test e build passano.
2. Nei lavori, nessun file di processo toccato (`CLAUDE.md`, `.claude/`, `docs/METODO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, `.github/`, `docs/BRIEF.md`).
3. Nei lavori, i test scritti nel primo task non sono stati cambiati dopo (salvo che il diario li nomini sotto "Decisioni da confermare").
4. Nei lavori, ogni riga di task chiuso del diario ha `revisore: APPROVATO` o `revisore: RESPINTO` (il task del report è escluso). La regola è scritta anche in `CLAUDE.md`.
5. Sul database, nessuna migrazione esistente toccata e nessun `drop`, `rename` o cambio di tipo nei file `supabase/aggiornamento-*.sql`.

Le pull request `<utente>/docs-<parola>` fanno solo il controllo 1.

Come provarlo: apri una pull request verso `dev` e guarda la spunta o la croce accanto ad essa. Nessun SQL da eseguire. Non rende nulla obbligatorio per unire: lo deciderai tu dopo un paio di settimane.

**Atteso:** la pull request di questo lavoro tocca `CLAUDE.md` e `.github/` perché l'issue lo autorizza, quindi il controllo 2 mostrerà una croce rossa. Va accettata a mano.

## Prove di collaudo
1. Apri una pull request di prova verso `dev` che cambia solo un file in `src/` → devi vedere la spunta verde dopo qualche minuto.
2. Nella stessa pull request aggiungi una modifica a `docs/BRIEF.md` e invia → devi vedere la croce rossa e, nel passo "Controlli 2-5", una riga che nomina `docs/BRIEF.md`.
3. Su un branch `<utente>/docs-prova` modifica `docs/BRIEF.md` → devi vedere la spunta verde (solo il controllo 1).

## Tecnica
- Task chiusi: T64.1 (test di accettazione, 27 casi), T64.2 (`tools/controlli-pr.mjs`), T64.3 (`.github/workflows/controlli-pr.yml`, 4 test), T64.4 (riga in `CLAUDE.md`). Nessun task bloccato.
- Il controllo 3 considera "test" solo i file `*.test.*`, `*.spec.*` o sotto `tests/`: il commit T<n>.1 contiene anche diario e task, che non vanno protetti. Trovato provando lo script sul branch reale.
- Il workflow passa il nome del branch tramite variabile d'ambiente, ha permessi `contents: read`, usa solo azioni `actions/*`, nessun segreto. I controlli 2-5 girano anche se il controllo 1 fallisce.
- Decisioni da confermare: Node 22 (il repository non dichiara una versione); `docs-` fa solo il controllo 1 anche per il database.
- Non verificato: il workflow su GitHub (non provabile dalla sessione): si vedrà alla prima pull request. Se la prima volta fallisce per motivi di configurazione, va corretto.
- Nessun database toccato.
