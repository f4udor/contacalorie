# Diario

Una riga per task chiuso.

## Task chiusi

- T1.0 · bloccato · respinto due volte dalla revisione: la regola di lint su `src/engine` si aggira con `./../app/page` (il pattern `^(?!\./)` accetta ogni import che inizia con `./`). Correzione indicata dal revisore: regex `^(?!\./[A-Za-z0-9_-]+$)` (per i test `^(?!\./[A-Za-z0-9_-]+$|vitest$)`) più i casi `./../app/page` e `./sub/../../app/page` in `tools/lint-engine.test.ts`. Il resto del task (lint/test/build, pagina, diario, `.gitkeep`) è approvato.
- T1.1 · fatto · tipi, default di §3, `mergeSettings` con test. Aggiunti `proteinGramsManual`/`fatGramsManual` (null = formula).
- T1.2 · fatto · kcal di budget (`kcalBudget`, tetto pasto libero), kcal reali (`kcalEaten`), `hasFreeMealInWeek` con esclusione.
- T1.3 · fatto · bonus bici (`bikeBonus`) e passi (`stepsBonus`); casi A, E, F.
- T1.4 · fatto · `dayTarget` (§3.3) con date in UTC (`dates.ts`); casi A, B, C, D, H. Il giorno stesso è escluso dal saldo; date duplicate in ingresso non gestite.
- T1.5 · fatto · `nutrientTargets` (§3.4); casi E, F, G. Carboidrati arrotondati al grammo intero.
- T1.6 · fatto · semafori minimo/intervallo/tetto e anello kcal (`traffic.ts`); casi I, J e tutti i confini.
- T1.7 · fatto · `weekSummary`: giorni, saldo, medie, km, passi, pasto libero, sfida; settimana vuota → `null`. Scelte in 'Decisioni da confermare'.
- T1.8 · fatto · `challengeDay` con piano come dato (`DEFAULT_CHALLENGE_PLAN` in file a parte); aggiunta `daysBetween`.

## Decisioni da confermare

- Carboidrati arrotondati al grammo intero (§3.4 non lo specifica; gli esempi di §3.6 sono interi).
- Soglia gialla dell'anello kcal (×1,05) è una costante `KCAL_RING_YELLOW_LIMIT` in `defaults.ts`, non un'impostazione modificabile: §3 non la elenca tra le impostazioni.
- Semaforo "tetto" (sale): assunto esattamente uguale al tetto → giallo; rosso solo se supera il tetto.
- Il giorno di cui si calcola l'obiettivo non entra nel proprio saldo (solo i giorni precedenti).
- Riepilogo settimana: "media kcal" usa le kcal reali (non il budget); "saldo" usa il budget (pasto libero col tetto); passi 0 sono considerati assenti nella media; km totali `null` solo se nessun giorno ha km registrati.
- Il saldo della settimana somma tutti i giorni con pasti (anche l'ultimo), a differenza del saldo di `dayTarget` che si ferma ai giorni precedenti.
- Piano della sfida come piano di sistema (`user_id` null, uguale per tutti) scelto da `settings.challenge_plan_id`; la data di inizio è in `settings.challenge_start_date`.
- Il vincolo "un solo pasto libero a settimana" non è nel database (si controlla nell'app con `hasFreeMealInWeek`).
- Token degli ingressi: nel database solo l'impronta (hash).

## Non verificato

- T1.0: la regola di lint `no-restricted-imports` non copre `require()` né `import()` dinamico.
- T1.0: il buco `./../` nella regola di lint resta aperto finché il task è bloccato.
- T1.9: le migrazioni sono state eseguite solo su un PostgreSQL 16 locale con uno stand-in di `auth.users`/`auth.uid()` e del ruolo `authenticated`; non su Supabase reale. Verificato lì: creazione di tutte le tabelle, dato iniziale (1 piano, 12 esercizi), isolamento tra due utenti (lettura, modifica, inserimento altrui rifiutati), piano di sistema non modificabile, unicità attività per utente e data. Non verificato: comportamento con il vero `auth.uid()` di Supabase, grant dei ruoli Supabase, `gen_random_uuid()` su Supabase.
