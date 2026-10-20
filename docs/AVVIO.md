# Avvio: preparazione di un progetto nuovo

Istruzioni per la chat che guida una persona nella preparazione per lavorare a Personal Health. Oggi serve a Claudiu (GitHub `niss23`); vale anche per Mauro, se deve rifare il suo progetto.

## Come si usa

La persona apre una chat nuova su claude.ai e incolla questo messaggio:

```
Leggi https://github.com/f4udor/contacalorie/blob/dev/docs/AVVIO.md
e guidami nella preparazione per lavorare a Personal Health.
```

## Regole per la chat che guida

- Prima legge anche `docs/METODO.md` e `docs/CONTESTO.md` dallo stesso branch, per sapere cosa sta preparando.
- Un passo alla volta: spiega cosa fare in due o tre righe, aspetta che la persona dica com'è andata, poi passa al successivo.
- Quando un passo lo può fare lei con i propri strumenti (creare o condividere un file su Drive), lo fa, dopo averlo detto.
- Non indovina menu o percorsi delle impostazioni che non conosce: descrive cosa cercare.
- Alla fine segna la preparazione come conclusa (passo 9).

## I passi

1. **Invito GitHub.** Accettare l'invito di Mauro al repository `f4udor/contacalorie`: arriva per email da GitHub, oppure si trova tra le notifiche di github.com.
2. **Notifiche.** Installare l'app GitHub sul telefono e lasciare attive le notifiche: avvisa quando l'altro chiede di approvare una pull request.
3. **Connettori della chat.** Nelle impostazioni di claude.ai, tra i connettori, collegare **GitHub** (per aprire le pull request dei documenti), **Google Drive** e **Google Docs** (per i file di stato).
4. **Claude Code.** Aprire Claude Code sul web (claude.ai/code) e collegare l'account GitHub, dando accesso al repository `f4udor/contacalorie`. Serve per lanciare le sessioni che scrivono il codice.
5. **Progetto Claude.** Creare un progetto "Personal Health" e incollare come istruzioni il testo di "Istruzioni del progetto" qui sotto, con nome, utente GitHub e file di stato giusti. Non serve caricare file: tutto il resto la chat lo legge dal repository.
6. **File di stato.** Tre passaggi:
   - creare nel proprio Drive il file `personal-health-stato-<nome>.md` con il modello qui sotto (lo può creare la chat);
   - condividerlo in sola lettura con l'altra persona (la chat chiede l'email);
   - aprire il file `personal-health-stato-comune.md` che Mauro ha condiviso come editor, e quello personale di Mauro, per controllare che si leggano.
7. **Database di prova.** Accettare l'invito al progetto Supabase di prova, quando arriva. Serve per eseguire gli SQL delle proprie fasi. Il database vero resta solo di Mauro.
8. **Gruppo WhatsApp.** Entrare nel gruppo di lavoro e scrivere "pronto".
9. **Fine.** La chat scrive nel file di stato personale "Preparazione conclusa il <data>" e toglie la voce corrispondente dal file comune. Poi suggerisce di aprire la prima chat dentro il progetto.

Su Vercel entra solo Mauro: il piano gratuito ha un posto. I link alle anteprime si trovano nei commenti di Vercel sulle pull request.

## Istruzioni del progetto

Da incollare nelle istruzioni del progetto Claude, sostituendo le parti tra `< >`:

```
Questo progetto serve a progettare e far costruire "Personal Health",
l'app per dieta e attività fisica che sviluppiamo in due, Mauro e Claudiu.
Io sono <nome>, GitHub <utente>. Non scrivo codice: lo scrive solo
Claude Code.

ALL'INIZIO DI OGNI CHAT
1. Leggi dal repository f4udor/contacalorie, branch dev, docs/METODO.md
   e docs/CONTESTO.md. Segui docs/METODO.md sempre, senza eccezioni.
2. Leggi su Drive i tre file di stato: personal-health-stato-comune.md,
   personal-health-stato-mauro.md e personal-health-stato-claudiu.md.
   Il mio è personal-health-stato-<nome>.md: lo aggiorni tu, sul posto.
3. Se il mio file di stato non dice "Preparazione conclusa", guidami nei
   passi mancanti di docs/AVVIO.md.

VINCOLI MIEI
- Credito per le sessioni di Claude Code: <importo e scadenza, oppure
  "piano Pro">. Ogni proposta ne tiene conto.
```

## Modello del file di stato personale

```
# Personal Health: stato di <nome>

Aggiornato: <data e ora>
Altri stati: personal-health-stato-comune.md e personal-health-stato-<altro>.md. Regole in docs/METODO.md, sezione Stato.

## Fase attuale
Preparazione in corso (docs/AVVIO.md).

## Prossimo passo
1. <passo>

## Decisioni in attesa di <nome>
- Nessuna.

## Verifiche da fare
- Nessuna.

## Credito
<importo e scadenza, oppure piano Pro>
```
