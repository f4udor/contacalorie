# Diario

Una riga per task chiuso.

## Task chiusi

- T1.0 · bloccato · respinto due volte dalla revisione: la regola di lint su `src/engine` si aggira con `./../app/page` (il pattern `^(?!\./)` accetta ogni import che inizia con `./`). Correzione indicata dal revisore: regex `^(?!\./[A-Za-z0-9_-]+$)` (per i test `^(?!\./[A-Za-z0-9_-]+$|vitest$)`) più i casi `./../app/page` e `./sub/../../app/page` in `tools/lint-engine.test.ts`. Il resto del task (lint/test/build, pagina, diario, `.gitkeep`) è approvato.
- T1.1 · fatto · tipi, default di §3, `mergeSettings` con test. Aggiunti `proteinGramsManual`/`fatGramsManual` (null = formula).
- T1.2 · fatto · kcal di budget (`kcalBudget`, tetto pasto libero), kcal reali (`kcalEaten`), `hasFreeMealInWeek` con esclusione.
- T1.3 · fatto · bonus bici (`bikeBonus`) e passi (`stepsBonus`); casi A, E, F.
- T1.4 · fatto · `dayTarget` (§3.3) con date in UTC (`dates.ts`); casi A, B, C, D, H. Il giorno stesso è escluso dal saldo; date duplicate in ingresso non gestite.
- T1.5 · fatto · `nutrientTargets` (§3.4); casi E, F, G. Carboidrati arrotondati al grammo intero.

## Decisioni da confermare

- Carboidrati arrotondati al grammo intero (§3.4 non lo specifica; gli esempi di §3.6 sono interi).
- Soglia gialla dell'anello kcal (×1,05) è una costante `KCAL_RING_YELLOW_LIMIT` in `defaults.ts`, non un'impostazione modificabile: §3 non la elenca tra le impostazioni.
- Semaforo "tetto" (sale): assunto esattamente uguale al tetto → giallo; rosso solo se supera il tetto.
- Il giorno di cui si calcola l'obiettivo non entra nel proprio saldo (solo i giorni precedenti).

## Non verificato

- T1.0: la regola di lint `no-restricted-imports` non copre `require()` né `import()` dinamico.
- T1.0: il buco `./../` nella regola di lint resta aperto finché il task è bloccato.

