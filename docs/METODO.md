# Metodo di lavoro

Regole per le persone e per la chat che progetta l'app (il progetto Claude di Mauro e quello di Claudiu). Le regole per le sessioni di Claude Code stanno in `CLAUDE.md` e in `.claude/agents/`. Come si prepara un progetto nuovo: `docs/AVVIO.md`.

## Chi lavora

- **Mauro** (GitHub `f4udor`) e **Claudiu** (GitHub `niss23`). Nessuno dei due scrive codice e nemmeno la chat: il codice lo scrive solo Claude Code. Le persone giudicano schermate e comportamento.
- Ognuno ha la sua chat di progetto, le sue sessioni di Claude Code e i limiti del suo piano.
- **Il prodotto si decide in due**: regole, numeri, schermate (`docs/BRIEF.md`).
- **Il processo è di Mauro**: questo documento, `CLAUDE.md`, `.claude/agents/`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, le guide `docs/COLLEGA-*.md`. Mauro li cambia e unisce da solo; Claudiu li legge. Sono di Mauro anche gli **strumenti di lavoro**: codice che serve solo a come si lavora (anteprime, icone delle versioni di prova, script di prova) e non cambia l'app vera; le loro issue hanno l'etichetta `strumenti`.
- L'obiettivo è un'app che si usa davvero, non un prodotto da vendere.

## Ruolo della chat

Agisce come un senior product e tech lead che affianca chi le parla.

- Su una scelta tecnica dà una raccomandazione chiara, con il motivo in una o due frasi, in linguaggio non tecnico. Sceglie e dice cosa si perde.
- Se si aggiungono funzioni oltre il necessario, lo dice e propone di farne un'issue `idea`.
- Se un'idea è troppo complessa, propone la versione più semplice che ottiene lo stesso risultato.
- Se si parte da un presupposto errato, lo corregge subito. Se sbaglia lei, lo dice e corregge.
- Non blocca il lavoro: per ogni dubbio propone una scelta di default e va avanti. Fa domande solo se la risposta cambia cosa si costruisce.
- Risponde in italiano, in modo diretto e sintetico. Comandi e passaggi da eseguire: uno alla volta, aspettando l'esito.
- Non scrive documenti né mette `pronta` su un'issue finché non si è deciso in chat.
- Su GitHub scrive con lo strumento GitHub della sessione: crea e modifica issue, etichette e commenti, apre le pull request dei documenti. Non unisce mai una pull request: unisce sempre una persona.

## Inizio di ogni chat

1. Legge `docs/METODO.md` e `docs/CONTESTO.md` dal branch `dev`.
2. Legge i tre file di stato su Drive (vedi "Stato").
3. Guarda su GitHub le issue e le pull request aperte con l'etichetta della persona (`per-mauro` o `per-claudiu`) e le issue a lei assegnate: dice in poche righe cosa la aspetta.
4. Se la chat tocca regole, schermate o lavori, legge i file che servono: `docs/BRIEF.md`, l'issue, la cartella del lavoro in `docs/lavori/`. Non dà per buono un ricordo: ciò che è stato costruito si legge nel repository.

## Dove sta cosa

| Cosa | Dove |
|---|---|
| Quadro dell'app, principi | `docs/CONTESTO.md` |
| Regole esatte, numeri, casi di verifica, schermate, stile | `docs/BRIEF.md` |
| Idee e lavori da fare, con il responsabile | issue di GitHub (etichette `idea` e `da-fare`) |
| Task, diario e report di un lavoro | `docs/lavori/<n>-<parola>/` (`TASKS.md`, `DIARIO.md`, `REPORT.md`) |
| Task, diario e report fino alla fase 8 | `docs/archivio/` (si legge solo se serve) |
| Regole per Claude Code e agenti | `CLAUDE.md` e `.claude/agents/` |
| Testi delle attività programmate | `docs/ATTIVITA.md` |
| Questo metodo | `docs/METODO.md` |
| Preparazione di un progetto nuovo | `docs/AVVIO.md` |
| A che punto è ciascuno, decisioni comuni in attesa | tre file su Google Drive (vedi "Stato") |

I numeri stanno solo in `docs/BRIEF.md`. Ogni informazione ha un solo posto. `<n>` è sempre il numero dell'issue.

## Branch e versioni dell'app

| Branch | Cos'è | Si aggiorna |
|---|---|---|
| `main` | l'app che si usa tutti i giorni | solo con la pull request da `dev`, approvata da Claudiu |
| `dev` | versione comune di prova | solo con pull request (vedi "Chi approva cosa") |
| `<utente>/<n>-<parola>` | un lavoro, es. `f4udor/31-trend` | dalle sessioni di Claude Code |
| `<utente>/docs-<parola>` | documenti scritti dalla chat | dalla chat |

- `<utente>` è il responsabile dell'issue, chiunque lanci la sessione.
- Ogni branch ha la sua anteprima su Vercel: il link compare nei commenti della pull request.
- Le anteprime (`dev` e branch dei lavori) usano il database Supabase di prova e Gemini vero con un limite basso. Il `main` usa il database vero.

## Chi approva cosa

GitHub non lascia approvare la propria pull request. Le regole su GitHub:
- **`dev`**: serve un'approvazione; Mauro, come amministratore, può unire senza, ma solo tramite pull request.
- **`main`**: serve sempre un'approvazione, senza eccezioni. Nessun agente può pubblicare l'app da solo.

| Pull request | Chi approva | Chi unisce |
|---|---|---|
| Lavoro (codice) verso `dev` | l'altra persona | il responsabile |
| Regole di prodotto (`docs/BRIEF.md`) verso `dev` | l'altra persona | chi l'ha aperta |
| Processo e documenti di Mauro (vedi "Chi lavora") | nessuno | Mauro, da solo |
| Strumenti di lavoro (issue con `strumenti`) | nessuno; il valutatore di Claudiu commenta comunque | Mauro, da solo |
| `dev` verso `main` | Claudiu | Mauro |

L'eccezione di Mauro su `dev` vale solo per le pull request di processo, documenti e strumenti di lavoro: per i lavori e le regole di prodotto si aspetta sempre l'altro. GitHub registra ogni uso dell'eccezione.

## Etichette

Le etichette sono il semaforo: dicono a chi tocca. Gli agenti mettono le etichette `per-…`; chi ha fatto la sua parte la toglie.

| Etichetta | Su | Significa | La mette |
|---|---|---|---|
| `idea` | issue | idea non decisa | la chat |
| `da-fare` | issue | lavoro deciso, con responsabile assegnato | la chat |
| `strumenti` | issue | strumento di lavoro di Mauro: lo unisce da solo (vedi "Chi lavora") | la chat di Mauro |
| `pronta` | issue | il "cosa" è scritto e approvato dal responsabile: la sessione notturna la prende | la chat |
| `in-lavorazione` | issue | una sessione ci sta lavorando | la sessione |
| `domanda` | issue | il pianificatore ha una domanda di prodotto (nei commenti) | la sessione |
| `bloccata` | issue | la sessione non è riuscita a finire (motivo nei commenti) | la sessione |
| `sql-da-eseguire` | pull request | c'è un file SQL da eseguire sul database di prova | la sessione |
| `per-mauro`, `per-claudiu` | issue e pull request | serve un'azione di quella persona (nei commenti cosa) | gli agenti |

Le etichette `per-…` arrivano come notifica su Slack (vedi "Comunicazione").

## Ciclo di un lavoro

1. **Riunione.** Mauro e Claudiu decidono. Uno dei due incolla gli appunti nella sua chat: la chat crea le issue `idea` e `da-fare`, ognuna `da-fare` con il responsabile assegnato.
2. **Definire il "cosa".** Il responsabile e la sua chat scrivono nell'issue cosa deve fare il lavoro, con il modello di issue (sezioni fisse: cosa, criteri di accettazione, casi numerici, bozze, fuori dal lavoro, sezioni del brief). Ogni idea nuova passa prima dalle domande di `docs/CONTESTO.md` §8.
   - Se cambia una regola di prodotto: la chat la scrive in `docs/BRIEF.md` su `<utente>/docs-<parola>` (casi di verifica numerici se tocca i calcoli), l'altro approva la pull request, poi si va avanti.
   - Per la grafica si preparano bozze da guardare prima.
3. **Pronta.** Quando il responsabile dice che va bene, la chat mette `pronta`. È l'ultimo momento per cambiare idea a costo zero.
4. **Notte: pianificare e costruire.** L'attività notturna del responsabile prende un'issue `pronta`: il pianificatore legge issue, brief e codice e scrive i task (al massimo 8); costruttore e revisore li eseguono; alla fine la sessione apre la pull request verso `dev` in bozza e mette `per-<responsabile>`. Se il pianificatore trova una scelta di prodotto non decisa, mette `domanda` e si ferma.
5. **SQL.** Se il lavoro ha un file SQL, la pull request ha `sql-da-eseguire` e `per-mauro`: Mauro lo esegue sul database di prova, scrive "eseguito" e toglie le due etichette. Prima di questo l'anteprima non funziona.
6. **Provare.** Il responsabile prova l'anteprima del branch sul telefono, con l'elenco di prove del report. Se va bene, segna la pull request come pronta ("Ready for review") e toglie la sua etichetta. Se c'è da correggere, lo dice alla sua chat: la chat scrive cosa correggere nell'issue e rimette `pronta`; la notte dopo la sessione continua sullo stesso branch.
7. **Valutare.** Appena la pull request non è più in bozza, parte da sola l'attività "valutatore" dell'altra persona: scrive un commento con il verdetto in parole semplici, le decisioni da confermare e le prove sul telefono, e mette `per-<altro>`. Se trova problemi gravi rimette la pull request in bozza e mette `per-<responsabile>`.
8. **Approvare e unire.** L'altro legge la valutazione, se vuole prova l'anteprima, approva e toglie la sua etichetta. Il responsabile unisce in `dev`. L'issue si chiude da sola.
9. **Uscita di versione.** Quando entrambi hanno usato `dev` e va bene: Mauro esegue gli SQL sul Supabase vero, apre la pull request da `dev` a `main`, Claudiu approva, Mauro unisce. Vercel ripubblica da solo. Le rifiniture sono lavori come gli altri: si passa sempre da `dev`.

Due lavori in parallelo non toccano lo stesso modulo: lo si decide quando si assegnano. Se capita, chi unisce per secondo fa aggiornare il branch con `dev` da una sessione.

## Agenti e attività programmate

| Agente | Dove | Quando |
|---|---|---|
| Chat di progetto | claude.ai, progetto di ciascuno | quando la persona la apre |
| Pianificatore | `.claude/agents/pianificatore.md` | inizio della sessione notturna |
| Costruttore | la sessione stessa (`CLAUDE.md`) | dopo il pianificatore |
| Revisore | `.claude/agents/revisore.md` | dopo ogni task |
| Valutatore PR | `.claude/agents/valutatore-pr.md` | quando una pull request dell'altro esce dalla bozza |

Ognuno ha sul proprio account due attività programmate, con i testi di `docs/ATTIVITA.md`:
- **Notturna** (02:40): un lavoro `pronta` a notte, solo tra le issue assegnate a lui.
- **Valutatore**: parte a evento sulle pull request dell'altro.

Le attività girano senza chiedere conferme e senza connettori: solo il repository. Ciò che fanno su GitHub risulta fatto dalla persona che le ha create.

## Lancio a mano e piano B

- **A mano**: una sessione cloud su `dev` con il messaggio "Lavora sull'issue #<n> come dice `CLAUDE.md`, sezione 'Sessione su un'issue'". Serve per rifare subito un giro senza aspettare la notte. Mai due sessioni sullo stesso lavoro.
- **Piano B**, se Claudiu non può usare le attività: Mauro lancia anche i lavori di Claudiu. Il branch prende comunque il nome di Claudiu; le pull request risultano di Mauro, quindi le approva Claudiu dopo averle provate e Mauro unisce. Il valutatore va lanciato a mano.

## Stato

Tre Google Doc, letti da entrambe le chat a ogni inizio:

| File | Dove | Chi scrive | Contenuto |
|---|---|---|---|
| `personal-health-stato-comune.md` | Drive di Mauro, condiviso con Claudiu come editor | entrambi | decisioni prese insieme e non ancora nel repository (con dove andranno); decisioni da prendere in due; cose che riguardano tutti e due |
| `personal-health-stato-mauro.md` | Drive di Mauro, Claudiu in sola lettura | la chat di Mauro | a cosa sta lavorando, prossimo passo, decisioni in attesa, verifiche |
| `personal-health-stato-claudiu.md` | Drive di Claudiu, Mauro in sola lettura | la chat di Claudiu | lo stesso, per Claudiu |

- Lavori e priorità non stanno qui: stanno nelle issue.
- I file si modificano sul posto con il connettore Google Docs. Non si ricreano mai: altrimenti cambiano link e condivisione.
- Prima di scrivere si rilegge il file. Nel file comune si cambiano solo le righe che si toccano.
- Una decisione esce dal file comune quando è entrata nel suo posto con una pull request unita.
- Massimo 25 righe per file, niente storia.
- La chat aggiorna i file da sola, senza che le venga chiesto, ogni volta che: si unisce una pull request; si prende una decisione in attesa o ne nasce una nuova; cambia il prossimo passo; sta per proporre di cambiare chat. Dopo l'aggiornamento lo dice in una riga.

## Quando cambiare chat

La chat propone di aprirne una nuova quando la conversazione è lunga (molte decisioni, molti file letti, più lavori attraversati) o quando si accorge di dover rileggere cose già dette. Meglio un po' prima che un po' dopo. Prima aggiorna stato, contesto e, se serve, brief e issue; poi scrive un messaggio di poche righe da incollare nella nuova chat: a che punto si è, cosa fare per primo, cosa leggere, eventuali link. Niente che sia già negli stati.

## Regole fisse

- Al modello AI dell'app va solo il testo del pasto con data e ora. Mandare altri dati è una decisione esplicita di Mauro.
- Il database cresce per aggiunte: mai rinominare o eliminare.
- Gli SQL li esegue solo Mauro: sul database di prova prima di provare un'anteprima, su quello vero prima dell'uscita di versione. Nessun agente tocca un database.
- Su Vercel e sul Supabase vero agisce solo Mauro.
- Niente si costruisce su ipotesi non verificate: se un punto è incerto, prima si prova.
- Prezzi, limiti e condizioni dei servizi esterni si verificano online prima di darli per buoni.
- Ogni proposta tiene conto del costo: un lavoro che tocca tutte le schermate costa molto più di uno mirato.
- Nessuno scrive direttamente su `dev` o `main`. Nessun agente unisce una pull request.
- Le sessioni di Claude Code lavorano solo nel repository, con servizi simulati, senza chiavi né dati reali; una costruisce e un revisore con contesto pulito controlla ogni task; un valutatore indipendente controlla la pull request; mai due sessioni sullo stesso lavoro; non prendono decisioni di prodotto, le segnalano.

## Comunicazione

Uno spazio Slack per Mauro e Claudiu, con l'app GitHub:
- `#mauro` riceve le issue e le pull request con l'etichetta `per-mauro`; `#claudiu` quelle con `per-claudiu`. Ognuno tiene attive le notifiche del suo canale.
- `#generale` per le persone: decisioni da prendere in due (che finiscono anche nel file di stato comune), "unito in dev", uscite di versione.

Gli agenti non scrivono su Slack: scrivono su GitHub, e l'app GitHub porta i messaggi su Slack. Le approvazioni delle pull request arrivano anche come notifica dell'app GitHub sul telefono.
