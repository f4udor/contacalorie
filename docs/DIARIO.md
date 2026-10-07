# Diario

Una riga per task chiuso.

## Task chiusi

- T1.0 · bloccato · respinto due volte dalla revisione: la regola di lint su `src/engine` si aggira con `./../app/page` (il pattern `^(?!\./)` accetta ogni import che inizia con `./`). Correzione indicata dal revisore: regex `^(?!\./[A-Za-z0-9_-]+$)` (per i test `^(?!\./[A-Za-z0-9_-]+$|vitest$)`) più i casi `./../app/page` e `./sub/../../app/page` in `tools/lint-engine.test.ts`. Il resto del task (lint/test/build, pagina, diario, `.gitkeep`) è approvato.
- T1.1 · fatto · tipi, default di §3, `mergeSettings` con test. Aggiunti `proteinGramsManual`/`fatGramsManual` (null = formula).
- T1.2 · fatto · kcal di budget (`kcalBudget`, tetto pasto libero), kcal reali (`kcalEaten`), `hasFreeMealInWeek` con esclusione.
- T1.3 · fatto · bonus bici (`bikeBonus`) e passi (`stepsBonus`); casi A, E, F.

## Decisioni da confermare

## Non verificato

- T1.0: la regola di lint `no-restricted-imports` non copre `require()` né `import()` dinamico.
- T1.0: il buco `./../` nella regola di lint resta aperto finché il task è bloccato.

