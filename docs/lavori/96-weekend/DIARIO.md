# Diario #96

- T96.1 · test di accettazione scritti dal collaudatore (6 test, falliscono finché manca `weekEnd`) · revisore: APPROVATO
- T96.2 · `weekEnd` in `src/engine/dates.ts` (`addDays(weekStart(date), 6)`); lint e test passano (1070) · revisore: APPROVATO

## Decisioni da confermare
Nessuna.

## Risolte dal collaudatore
Nessuna.

## Non verificato
- `npm run build`: in questa sessione esce con codice 1 per un avviso di sicurezza di Next.js 16.4.0 (SecurityFatalError), identico anche su `dev` senza la modifica; compilazione e TypeScript passano. Il controllo automatico su GitHub lo rifà.
