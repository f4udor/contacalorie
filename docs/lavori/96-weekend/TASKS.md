# #96 Prova del processo: funzione weekEnd

Issue: #96 · Responsabile: f4udor · Branch: f4udor/96-weekend
Obiettivo: aggiungere nel motore delle date `weekEnd(date)`, che restituisce la domenica della settimana che contiene la data.
Sezioni delle specifiche: nessuna (utilità di date, nessuna regola del brief).
Vincoli: database no; nessuna schermata e nessun uso della funzione; `src/engine` resta puro (nessun import dal resto, nessuna lettura di data/ora); non toccare i test esistenti; lavoro di prova, la pull request non va unita.

## Scelte del pianificatore
- `weekEnd` si scrive come `addDays(weekStart(date), 6)`: riusa le funzioni esistenti, quindi la data non valida lancia lo stesso errore (`Data non valida: <data>`) senza codice nuovo.
- I test stanno in un file nuovo `src/engine/weekEnd.test.ts`, per non modificare `dates.test.ts` (i test esistenti non si cambiano).
- Niente task di schermate né percorsi: il lavoro non ha interfaccia.

## Giro 1

### T96.1 Test di accettazione · fatto
- Cosa fare: scrivere solo i test dei criteri dell'issue per `weekEnd`, prima del codice. Possono fallire finché T96.2 non è fatto.
- File e cartelle: nuovo `src/engine/weekEnd.test.ts` (Vitest). Funzione da testare: `weekEnd(date: DateKey): DateKey`, che sarà in `src/engine/dates.ts`; il tipo `DateKey` è una stringa `"AAAA-MM-GG"` (da `src/engine/types.ts`). Importare `weekEnd` da `./index` (verifica anche l'esportazione) e, per il confronto dell'errore, `weekStart` da `./index`.
- Criteri di accettazione e numeri esatti:
  - `weekEnd("2026-11-17")` = `"2026-11-22"`.
  - `weekEnd("2026-11-22")` (domenica) = `"2026-11-22"`.
  - `weekEnd("2026-11-23")` (lunedì) = `"2026-11-29"`.
  - `weekEnd("2026-12-31")` = `"2027-01-03"` (passaggio d'anno).
  - Data non valida: `weekEnd("2026-02-30")` e `weekEnd("abc")` lanciano lo stesso errore di `weekStart` con gli stessi input (stesso messaggio, `Data non valida: <input>`).
  - `weekEnd` è esportata da `src/engine/index.ts` (importandola da `./index` è una funzione).
- Test: i casi sopra, con i numeri esatti; nessuno screenshot.
- Percorsi: nessuno (nessuna schermata).

### T96.2 Funzione weekEnd · da fare
- Cosa fare: aggiungere in `src/engine/dates.ts`, accanto a `weekStart`, `export function weekEnd(date: DateKey): DateKey` con commento "Domenica della settimana che contiene la data." Far passare i test di T96.1 senza modificarli.
- File e cartelle: `src/engine/dates.ts`. L'esportazione da `src/engine/index.ts` c'è già tramite `export * from "./dates"`: verificare, non duplicare.
- Criteri di accettazione: tutti i criteri di T96.1 passano; `npm run lint`, `npm test`, `npm run build` passano; nessun altro file cambia.
- Test: quelli di T96.1 (`2026-11-17` → `2026-11-22`; `2026-11-22` → `2026-11-22`; `2026-11-23` → `2026-11-29`; `2026-12-31` → `2027-01-03`; date non valide come `weekStart`).
- Percorsi: nessuno.

### T96.3 Report · da fare
Scrivi `REPORT.md` come dice `CLAUDE.md`, "Fine del lavoro".
