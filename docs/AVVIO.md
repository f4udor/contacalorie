# Avvio: preparazione di un progetto nuovo

Istruzioni per la chat che guida una persona nella preparazione per lavorare a Personal Health. Oggi serve a Claudiu (GitHub `NIss-gif`); vale anche per Mauro, se deve rifare il suo progetto.

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
- Prima dei passi tecnici fa l'**Orientamento** qui sotto, anche a chi ha già fatto una parte della preparazione.
- Alla fine segna la preparazione come conclusa (passo 9).
- Se la persona ha già fatto la preparazione con la versione precedente di questo documento, la chat le fa fare solo i passi che mancano (di solito 4, 7 e 8).

## Orientamento

Prima dei passi tecnici, perché le attività notturne o le etichette si capiscono solo dopo aver visto il ciclo. Cinque blocchi, circa 15 minuti: per ognuno la chat spiega in poche righe, con parole semplici, poi fa **una domanda** per controllare che sia chiaro e aspetta la risposta. Se la risposta mostra un dubbio, rispiega meglio prima di andare avanti. Dove la persona sa già (cosa fa l'app, perché la sviluppiamo, chi fa cosa), non lo ripete. La stessa cosa, da rileggere, sta su Notion: Personal Health → "Inizia da qui".

1. **Dove sta cosa.**
   - Lavori, idee e priorità: issue di GitHub. Ogni lavoro ha un responsabile.
   - Regole del prodotto e regole per gli agenti: repository (`docs/BRIEF.md`, `docs/METODO.md`, `CLAUDE.md`). Se due posti dicono cose diverse, vale il repository.
   - A che punto è ciascuno: tre file di stato su Drive.
   - Spiegazioni, roadmap, business, legale, riunioni: Notion.
   - Cosa tocca a te: Slack, canale con il proprio nome.
   Domanda: "Se vuoi sapere cosa devi fare oggi, dove guardi?" (Slack e le issue assegnate a te.)
2. **Il ciclo a due livelli**, con l'esempio vero della #50 (icone diverse per versione). Dettaglio in `docs/METODO.md`, "Ciclo di un lavoro" e "Uscita di versione".
   - Riunione → issue → il "cosa" scritto con la propria chat → `pronta`.
   - Di notte gli agenti costruiscono sul branch e aprono la pull request (la #50: aperta alle 02:44).
   - **Livello 1**: segni pronta la pull request, il valutatore dell'altro ti dà prove di 5 minuti, le fai sull'app rossa "PH Prova", racconti l'esito alla chat, unisci in `dev` da solo.
   - **Livello 2**: le prove di collaudo si accumulano in un'issue; tutti e due collaudate l'app gialla "PH Dev"; dopo almeno 7 giorni e con entrambi gli esiti ok si prepara l'uscita; l'app vera (`main`, blu) si aggiorna solo con l'approvazione di entrambi.
   Domanda: "Quando puoi unire da solo, e quando serve anche l'altro?" (Da solo in `dev` dopo valutazione ed esito ok; in `main` sempre in due.)
3. **I tuoi passaggi.** Le cose che solo la persona può fare: segnare pronta, fare le prove e raccontarle, unire in `dev`, collaudare, approvare le uscite (Claudiu) o eseguire gli SQL (Mauro). Ognuno si fa dall'app GitHub sul telefono oppure chiedendolo alla chat (`docs/METODO.md`, "Passaggi umani"). La chat non unisce e non approva mai.
   Domanda: "Hai fatto le prove e una non va: cosa fai?" (Lo racconti alla chat: scrive l'esito e rimette il lavoro in `pronta` con cosa correggere.)
4. **Gli agenti.** Pianificatore (divide il lavoro), costruttore (scrive il codice), revisore (controlla ogni pezzo senza conoscere il ragionamento di chi l'ha scritto), valutatore (controlla il lavoro finito per l'altra persona), rilascio (prepara il passaggio a `main`). Non decidono il prodotto: se manca una decisione si fermano e chiedono. Non unisce mai nessuno di loro. Non si parlano tra loro apposta: chi controlla non deve essere convinto da chi ha costruito. Quando qualcosa si rompe arriva un avviso "⚠️ Imprevisto" con cosa fare, e poi "✅ Risolto".
   Domanda: "Perché il revisore non vede il ragionamento del costruttore?"
5. **Come ti guida la chat, e il primo compito.** Quando tocca a te, alla fine del messaggio la chat scrive una riga "👉 Prossimo passo per te". Ciò che non è immediato diventa un'issue assegnata a te con `per-claudiu` (o `per-mauro`) e arriva su Slack. Ogni chat comincia con "inizia" e chiede un ruolo (oggi development od operations, oppure nessuno); i ruoli nuovi nascono dal lavoro che si ripete, e ognuno crea i suoi (`docs/ruoli/README.md`). Il primo compito di Claudiu è la roadmap: issue #73, da lavorare con la propria chat e portare in riunione.
   Domanda: "Dove ti arriva un compito nuovo?"

Poi si passa ai passi tecnici.

## I passi

1. **Invito GitHub.** Accettare l'invito di Mauro al repository `f4udor/contacalorie`: arriva per email da GitHub, oppure si trova tra le notifiche di github.com.
2. **Notifiche GitHub.** Installare l'app GitHub sul telefono e lasciare attive le notifiche: avvisa quando arrivano commenti e approvazioni sulle pull request.
3. **Connettori della chat.** Nelle impostazioni di claude.ai, tra i connettori, collegare **Google Drive** e **Google Docs** (file di stato), e nei permessi degli strumenti di ciascuno scegliere **"Consenti sempre"**: va fatto lì, non dal "Consenti sempre" dentro una chat, che vale solo per quella chat. Su GitHub la chat lavora agganciando il repository quando serve: chiede una conferma, una volta per chat.
4. **Claude Code.** Aprire Claude Code sul web (claude.ai/code) e collegare l'account GitHub. Poi avviare una sessione cloud sul repository `f4udor/contacalorie`, branch `dev`, con il messaggio "elenca le issue chiuse del repository con gh api". Se compaiono, le sessioni funzionano.
5. **Progetto Claude.** Creare un progetto "Personal Health" e incollare come istruzioni il testo di "Istruzioni del progetto" qui sotto, con nome, utente GitHub e file di stato giusti. Non serve caricare file: tutto il resto la chat lo legge dal repository.
6. **File di stato.** Tre passaggi:
   - creare nel proprio Drive il file `personal-health-stato-<nome>.md` con il modello qui sotto (lo può creare la chat);
   - condividerlo in sola lettura con l'altra persona (la chat chiede l'email);
   - aprire il file `personal-health-stato-comune.md` che Mauro ha condiviso come editor, e quello personale di Mauro, per controllare che si leggano.
7. **Slack.** Accettare l'invito allo spazio Slack, installare Slack sul telefono e attivare le notifiche di tutti i messaggi per il proprio canale (`#claudiu` o `#mauro`). Lì arrivano le richieste degli agenti.
8. **Attività programmate.** Creare sul proprio account le due attività di `docs/ATTIVITA.md` (notturna e valutatore) da **claude.ai/code/routines**, con i testi già pronti lì. La chat non può crearle da sola (in chat il comando `/schedule` non esiste): guida la persona nel modulo un campo alla volta, oppure, se la chat è nell'app desktop, lo compila dal browser integrato e la persona clicca **Creare**. Ricorda di togliere tutti i connettori. Poi la persona preme **Esegui ora** sulla notturna: senza issue `pronta` deve fermarsi dicendo che non c'è nulla da fare. Se non si riesce a crearle, vale il piano B di `docs/METODO.md`: le lancia Mauro.
9. **Fine.** La chat scrive nel file di stato personale "Preparazione conclusa il <data>" e toglie la voce corrispondente dal file comune. Poi spiega in cinque righe il ciclo di un lavoro (`docs/METODO.md`) e suggerisce di aprire la prima chat dentro il progetto.

Su Vercel e su Supabase entra solo Mauro: il piano gratuito di Vercel ha un posto, e gli SQL li esegue lui. I link alle anteprime si trovano nei commenti di Vercel sulle pull request.

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
- Claude Code con il piano Pro: le attività notturne consumano gli
  stessi limiti della chat.
```

## Modello del file di stato personale

```
# Personal Health: stato di <nome>

Aggiornato: <data e ora>
Altri stati: personal-health-stato-comune.md e personal-health-stato-<altro>.md. Regole in docs/METODO.md, sezione Stato.

## A cosa sto lavorando
Preparazione in corso (docs/AVVIO.md).

## Prossimo passo
1. <passo>

## Decisioni in attesa di <nome>
- Nessuna.

## Verifiche da fare
- Nessuna.
```
