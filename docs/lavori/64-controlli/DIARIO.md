# Diario #64

T64.1 · fatto · test di accettazione in `tools/controlli-pr.test.ts` (falliscono finché non c'è lo script) · revisore: APPROVATO
T64.2 · fatto · script `tools/controlli-pr.mjs`, 27 test passano · revisore: APPROVATO
T64.3 · fatto · workflow `.github/workflows/controlli-pr.yml` e test `tools/workflow-controlli.test.ts` (4 test) · revisore: APPROVATO
T64.4 · fatto · una riga in `CLAUDE.md` (formato del verdetto nel diario) · revisore: APPROVATO
T64.5 Report · fatto

Correzione a T64.2 (controllo 3 conta solo i file di test): trovata provando lo script sul branch reale.

## Decisioni da confermare
- Versione di Node del workflow: 22 (il repository non ne dichiara una).
- Pull request `docs-`: solo controllo 1, anche per il controllo 5 (l'issue dice due cose diverse; seguita la seconda frase).
- La pull request di #64 tocca `CLAUDE.md` e `.github/` per autorizzazione dell'issue: il controllo 2 la segnalerà, da accettare a mano.

## Non verificato
- Il workflow su GitHub: non verificabile dalla sessione, solo alla prima pull request.
