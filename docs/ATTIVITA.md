# Attività e sessioni da lanciare

L'unica attività programmata che ognuno crea sul proprio account di Claude Code è il **valutatore**, da **claude.ai/code/routines** (nell'interfaccia italiana: "Attività pianificate" → "Nuova attività" → "Configura manualmente"). Le sessioni di lavoro e le uscite si lanciano a mano. Regole: `docs/dev/METODO-DEV.md`. I testi restano corti apposta: la logica sta in `CLAUDE.md` e negli agenti, così cambiare il processo non richiede di toccare le attività. I testi generici stanno in `hustle/pipeline/07-dev/modelli/avvio-sessioni.md`.

Sostituisci `<utente>` con il proprio utente GitHub (`f4udor` o `NIss-gif`), `<altro>` con quello dell'altra persona e `<n>` con il numero dell'issue.

## Impostazioni comuni

- **Repository**: `f4udor/contacalorie`.
- **Ambiente**: Default.
- **Connettori**: nessuno. Toglili tutti: l'attività può usare ogni connettore incluso senza chiedere, e le serve solo il repository.
- **Approvazioni**: automatiche (le attività girano senza nessuno che guarda).
- **Correzione automatica delle pull request** ("Comportamento"): spenta. Le correzioni passano dall'issue.

## 1. Lavorare su un'issue (a mano)

Sessione cloud su `f4udor/contacalorie`, branch `dev`:

```
Lavora sull'issue #<n> come dice CLAUDE.md, sezione "Sessione su un'issue".
```

Mai due sessioni sullo stesso lavoro. Se Claudiu non può usare le sessioni, le lancia Mauro (piano B, `docs/METODO.md`).

## 2. Valutatore (a evento, automatico)

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

**Valutazione a mano**, da qualunque account (se il valutatore non parte): sessione cloud su `dev` con "Valuta la pull request #<numero> seguendo `.claude/agents/valutatore-pr.md`. Approvatore: <utente>."

Si prova con la prima pull request vera dell'altro.

## 3. Uscita di versione (a mano)

Si lanciano da claude.ai/code, nuova sessione sul repository `f4udor/contacalorie`, branch `dev`. Regole in `docs/dev/METODO-DEV.md`, "Collaudo e uscita di versione". Prepara l'uscita Mauro; l'approvazione è di Claudiu.

**Preparare l'uscita:**

```
Prepara l'uscita di versione sul repository f4udor/contacalorie.
Porta il repository su dev (git fetch origin dev, poi git checkout dev),
leggi .claude/agents/rilascio.md da lì e seguilo. Avvia l'agente
rilascio, oppure un agente general-purpose con il contenuto integrale
di quel file come istruzioni.
```

**Valutare l'uscita** (dopo backup, SQL ed "eseguito"):

```
Valutazione dell'uscita di versione sul repository f4udor/contacalorie.
Approvatore: NIss-gif. Porta il repository su dev (git fetch origin dev,
poi git checkout dev), leggi .claude/agents/valutatore-pr.md da lì e
valuta la pull request aperta da dev verso main seguendo la sezione
"Uscita di versione" di quel file.
```

## Avvio programmato (opzionale)

Se una persona vuole che una sessione parta da sola a un'ora fissa per controllare se c'è lavoro `pronta`, lo imposta sul proprio account con il testo "Controlla le issue `pronta` assegnate a <utente> e lavora sulla più vecchia come dice CLAUDE.md, 'Sessione su un'issue'. Se non ce ne sono, fermati". Non fa parte del metodo.
