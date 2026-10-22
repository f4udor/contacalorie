# Attività programmate

Le due attività che ognuno crea sul proprio account di Claude Code, da **claude.ai/code/routines** (nell'interfaccia italiana: "Attività pianificate" → "Nuova attività" → "Configura manualmente"). Repository e connettori stanno in "Impostazioni avanzate". Regole in `docs/METODO.md`, "Agenti e attività programmate". I testi qui sotto restano corti apposta: la logica sta in `CLAUDE.md` e negli agenti, così cambiare il processo non richiede di toccare le attività.

Sostituisci `<utente>` con il proprio utente GitHub (`f4udor` o `NIss-gif`) e `<altro>` con quello dell'altra persona.

## Impostazioni comuni

- **Repository**: `f4udor/contacalorie`.
- **Ambiente**: Default.
- **Connettori**: nessuno. Toglili tutti: l'attività può usare ogni connettore incluso senza chiedere, e le serve solo il repository.
- **Approvazioni**: automatiche (le attività girano senza nessuno che guarda).
- **Correzione automatica delle pull request** ("Comportamento"): spenta. Le correzioni passano dall'issue, come dice `docs/METODO.md`.

## 1. Notturna

- **Nome**: `Personal Health: notturna <utente>`
- **Quando**: ogni giorno alle 02:40, ora italiana.
- **Testo**:

```
Sessione notturna per <utente> sul repository f4udor/contacalorie.
Prima di tutto porta il repository sul branch dev (git fetch origin dev,
poi git checkout dev) e leggi CLAUDE.md da lì: valgono le regole di
quella versione. Poi segui CLAUDE.md, sezione "Sessione notturna",
con <utente> come utente.
```

## 2. Valutatore

- **Nome**: `Personal Health: valutatore per <utente>`
- **Quando**: evento GitHub, pull request, azione "ready_for_review", con i filtri: branch di destinazione uguale a `dev`; autore tra `<altro>` scritto in tutte le grafie usate su GitHub (per Claudiu: `NIss-gif, niss-gif`), perché il filtro potrebbe distinguere maiuscole e minuscole.
- **Testo**:

```
Valutazione di una pull request sul repository f4udor/contacalorie.
Approvatore: <utente>.
Prima di tutto porta il repository sul branch dev (git fetch origin dev,
poi git checkout dev) e leggi .claude/agents/valutatore-pr.md da lì.
Valuta la pull request che ha fatto partire questa sessione seguendo
quel file. Se non trovi i dati dell'evento, valuta le pull request
aperte verso dev, non in bozza, di <altro>, che non hanno ancora un
commento "## Valutazione" più recente del loro ultimo commit.
```

## Prova dopo la creazione

- **Notturna**: tocca "Esegui ora" quando non ci sono issue `pronta`. La sessione deve fermarsi dicendo che non c'è nulla da fare.
- **Valutatore**: si prova con la prima pull request vera dell'altro.
