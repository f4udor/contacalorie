# Metodo di sviluppo

Come si porta un lavoro dall'idea all'app vera, per qualunque prodotto Hustle. Le persone sono quelle indicate in `DEV-PRODOTTO.md` del prodotto. Le regole per le sessioni di Claude Code stanno in `SESSIONI.md`.

## Rami

| Branch | Cos'è | Si aggiorna |
|---|---|---|
| `main` | l'app vera | solo con la pull request da `dev`, approvata |
| `dev` | versione comune di prova (branch predefinito) | solo con pull request |
| `<utente>/<n>-<parola>` | un lavoro | dalle sessioni di Claude Code |
| `<utente>/docs-<parola>` | documenti scritti dalla chat | dalla chat |

`<utente>` è il responsabile dell'issue, chiunque lanci la sessione. Ogni branch ha la sua anteprima (vedi `DEV-PRODOTTO.md`). Le anteprime usano i servizi e il database di prova; solo `main` usa quelli veri.

## Chi approva cosa

- **`dev`**: si entra solo con una pull request, senza approvazioni obbligatorie su GitHub: il controllo prima di unire è la valutazione.
- **`main`**: serve sempre un'approvazione, senza eccezioni. Nessun agente pubblica l'app da solo.

| Pull request | Cosa serve prima di unire | Chi unisce |
|---|---|---|
| Lavoro (codice) verso `dev` | un commento "## Valutazione" con "consiglio di approvare", più recente dell'ultimo commit, e l'esito delle prove | il responsabile, da solo |
| Specifiche di prodotto verso `dev` | l'ok dell'altra persona (il prodotto si decide in due) | chi l'ha aperta |
| Processo e documenti | secondo l'accordo tra le persone | chi l'ha aperta |
| `dev` verso `main` | l'approvazione dell'altra persona su GitHub | chi prepara l'uscita |

Su `dev` queste regole non le impone GitHub: valgono per accordo. **Deroga all'unanimità**: se le due persone decidono insieme di saltare una regola per un caso preciso, lo scrivono e chi è amministratore la applica. Le protezioni di GitHub restano sempre. Gli agenti non derogano mai.

## Etichette

Il semaforo: dicono a chi tocca. Gli agenti mettono le etichette `per-…`; chi ha fatto la sua parte la toglie.

| Etichetta | Su | Significa | La mette |
|---|---|---|---|
| `idea` | issue | idea non decisa | la chat |
| `da-fare` | issue | lavoro deciso, con responsabile assegnato | la chat |
| `pronta` | issue | il "cosa" è scritto e approvato dal responsabile: si può lanciare la sessione | la chat |
| `in-lavorazione` | issue | una sessione ci sta lavorando | la sessione |
| `domanda` | issue | il pianificatore ha una domanda di prodotto (nei commenti) | la sessione |
| `bloccata` | issue | la sessione non è riuscita a finire (motivo nei commenti) | la sessione |
| `sql-da-eseguire` | pull request | c'è un file SQL da eseguire sul database di prova | la sessione |
| `per-<persona>` | issue e pull request | serve un'azione di quella persona (nei commenti cosa) | gli agenti |

**Assegnare un compito**, di codice o no, lo fa la chat su GitHub: issue `da-fare` assegnata alla persona, etichetta `per-<persona>` e subito dopo un commento con cosa deve fare. I compiti che non sono codice non diventano mai `pronta`.

## Ciclo di un lavoro

1. **Riunione.** Le persone decidono. Gli appunti vanno alla chat, che crea le issue `idea` e `da-fare` con il responsabile.
2. **Definire il "cosa".** Il responsabile e la sua chat scrivono nell'issue cosa deve fare il lavoro, con il modello di issue. Se cambia una regola di prodotto, la chat la scrive nelle specifiche su un branch di documenti e l'altra persona approva la pull request.
3. **Pronta.** Quando il responsabile dice che va bene, la chat fa prima gli stessi controlli del pianificatore (sezione "Controlli prima di scrivere" di `agents/pianificatore.md`) e porta in chat le domande che ne escono. Solo senza buchi mette `pronta`.
4. **Sessione.** Una persona lancia la sessione sull'issue `pronta` (testo in `modelli/avvio-sessioni.md`). Il pianificatore scrive i task (al massimo quelli indicati in `DEV-PRODOTTO.md`); il collaudatore scrive i test di accettazione da issue e specifiche, senza vedere il codice; costruttore e revisore eseguono gli altri task. Alla fine la sessione apre la pull request verso `dev` in bozza e mette `per-<responsabile>`. Se il pianificatore trova una scelta di prodotto non decisa, non scrive i task: mette `domanda` e `per-<responsabile>` e si ferma. Il responsabile risponde nella sua chat, che aggiorna l'issue e rimette `pronta`, poi si rilancia.
5. **SQL.** Se il lavoro ha un file SQL, la pull request ha `sql-da-eseguire`. Una persona (o la chat, con il connettore del database di prova) lo esegue dopo aver controllato che contenga solo aggiunte, poi scrive "eseguito" e toglie le etichette.
6. **Pronta per la valutazione.** Il responsabile segna la pull request come pronta, anche senza averla provata.
7. **Valutare.** Appena la pull request esce dalla bozza, parte da solo il valutatore dell'altra persona: scrive "## Valutazione" con il verdetto, le decisioni da confermare e le prove prima di unire (al massimo 5 minuti), e mette `per-<responsabile>`. Se trova problemi gravi rimette la pull request in bozza.
8. **Provare.** Il responsabile fa le prove sull'anteprima del branch e racconta l'esito alla sua chat, che scrive "## Esito prove" sulla pull request. Se qualcosa non va, la chat scrive nell'issue cosa correggere e rimette `pronta`; la sessione successiva continua sullo stesso branch.
9. **Unire.** Con valutazione "consiglio di approvare" ed esito tutto ok, entrambi più recenti dell'ultimo commit, il responsabile unisce in `dev` da solo. Le decisioni da confermare `[prodotto]` le porta prima all'altra persona. L'issue si chiude da sola. Quando una persona unisce un lavoro, la chat guarda nel suo `DIARIO.md` le righe `[brief]` e l'elenco "Risolte dal collaudatore" e propone di far entrare i casi che si ripetono nelle specifiche o nei controlli del pianificatore; non lo fa da sola.

Due lavori in parallelo non toccano lo stesso modulo: lo si decide quando si assegnano.

## Collaudo e uscita di versione

`main` è l'app vera. Ci si arriva da `dev`: esce tutto `dev` o niente.

**Collaudo.** Si fa una volta sola, quando il lavoro arriva in `dev`, ed è rapido: le "Prove di collaudo" del `REPORT.md` del lavoro vengono eseguite su `dev` e l'esito si scrive sulla pull request del lavoro o su quella dell'uscita. Niente accumulo di prove, niente minimo di giorni. *(Da definire in dettaglio: quali prove, quante, chi.)*

**Requisiti per uscire** (li controllano l'agente di rilascio e poi il valutatore):
- `dev` sano: i comandi di verifica passano e il controllo automatico è verde.
- Ogni lavoro che esce è entrato in `dev` con pull request, valutazione positiva ed esito delle prove.
- Nessuna "Decisione da confermare" aperta; nessuna issue collegata `domanda`, `bloccata` o `in-lavorazione`.
- Esito del collaudo ok.
- SQL solo aggiunte, già eseguiti sul database di prova.

**Uscita.**
1. Una persona lancia la sessione "Prepara l'uscita" (testo in `modelli/avvio-sessioni.md`). L'agente di rilascio controlla i requisiti: se ne manca uno avvisa e si ferma; altrimenti scrive le note di versione e apre la pull request da `dev` a `main` in bozza.
2. Si fanno i passi previsti prima dell'uscita (per esempio backup ed esecuzione degli SQL sul database vero, come indicato in `DEV-PRODOTTO.md`), si scrive "eseguito" sulla pull request e si segna pronta.
3. Una persona lancia la valutazione dell'uscita: il valutatore ricontrolla tutto in modo indipendente e scrive "## Valutazione rilascio".
4. **Approvazione dell'altra persona su GitHub**, inderogabile; poi chi prepara l'uscita unisce e l'app si pubblica.
5. La chat crea l'etichetta di versione con le note. Se qualcosa si rompe si torna alla versione precedente.

## Passaggi umani

Ogni passaggio si fa dall'app GitHub oppure lo si chiede alla propria chat. La chat non unisce e non approva mai.

| Passaggio | Dall'app GitHub | Dalla chat |
|---|---|---|
| Segnare una pull request come pronta | pull request → "Ready for review" | "segna pronta la #N" |
| Raccontare l'esito di prove o collaudo | — | a parole libere; la chat scrive il commento |
| Unire in `dev` | "Merge pull request" → conferma | no |
| Togliere la propria etichetta `per-…` | Labels → togli la spunta | "togli la mia etichetta dalla #N" |
| Eseguire un SQL sul database di prova | SQL editor → incolla → Run; poi scrivi "eseguito" | la chat lo esegue se ha il connettore |
| Eseguire un SQL sul database vero | solo la persona indicata in `DEV-PRODOTTO.md`, dopo il backup | no |
| Approvare l'uscita | pull request verso `main` → Review → Approve | no |
| Lanciare una sessione | nuova sessione sul repository con il testo di `modelli/avvio-sessioni.md` | la chat dà il testo da incollare |

## Imprevisti

Chi deve agire lo sa con un messaggio chiaro, nel formato di `SESSIONI.md`, "Imprevisti". Si avvisa solo di ciò che serve sapere. Se il valutatore non parte su una pull request, la persona lancia la valutazione a mano da qualunque account: il valutatore resta indipendente da chi lo avvia, non approva e scrive solo un commento.

## Agenti

| Agente | Quando |
|---|---|
| Chat di progetto | quando la persona la apre |
| Pianificatore | all'inizio della sessione su un'issue |
| Costruttore | la sessione stessa, dopo il pianificatore |
| Collaudatore dei test | primo task di un lavoro con logica; poi su richiesta del costruttore (dubbi sui test) |
| Revisore | dopo ogni task |
| Valutatore PR | a evento, quando una pull request dell'altra persona esce dalla bozza; a mano sull'uscita |
| Rilascio | a mano, quando si prepara un'uscita |

## Regole fisse

- Nessuno scrive direttamente su `dev` o su `main`. Nessun agente unisce una pull request.
- Le sessioni di Claude Code lavorano solo nel repository, con servizi simulati, senza chiavi né dati reali. Una costruisce e un revisore con contesto pulito controlla ogni task; un valutatore indipendente controlla la pull request; mai due sessioni sullo stesso lavoro; non prendono decisioni di prodotto, le segnalano.
- Niente si costruisce su ipotesi non verificate: se un punto è incerto, prima si prova.
- Restano decisioni delle persone, non della chat: il database vero, le impostazioni dei servizi, la pubblicazione in produzione, tutto ciò che costa soldi o non si annulla.
