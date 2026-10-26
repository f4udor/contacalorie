# Metodo di lavoro

Regole per le persone e per la chat che progetta l'app (il progetto Claude di Mauro e quello di Claudiu). Le regole per le sessioni di Claude Code stanno in `CLAUDE.md` e in `.claude/agents/`. Come si prepara un progetto nuovo: `docs/AVVIO.md`.

## Chi lavora

- **Mauro** (GitHub `f4udor`) e **Claudiu** (GitHub `NIss-gif`). Nessuno dei due scrive codice e nemmeno la chat: il codice lo scrive solo Claude Code. Le persone giudicano schermate e comportamento.
- Ognuno ha la sua chat di progetto, le sue sessioni di Claude Code e i limiti del suo piano.
- **Il prodotto si decide in due**: regole, numeri, schermate (`docs/BRIEF.md`).
- **Il processo è di Mauro**: questo documento, `CLAUDE.md`, `.claude/agents/`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, le guide `docs/COLLEGA-*.md`. Mauro li cambia e unisce da solo; Claudiu li legge. Sono di Mauro anche gli **strumenti di lavoro**: codice che serve solo a come si lavora (anteprime, icone delle versioni di prova, script di prova) e non cambia l'app vera; le loro issue hanno l'etichetta `strumenti`. Fanno eccezione i ruoli della chat (`docs/ruoli/`): ognuno crea e modifica i suoi e li unisce da solo.
- L'obiettivo è un prodotto da vendere, con cui fondare una startup; si parte da un'app che si usa davvero ogni giorno.

## Ruolo della chat

Questo è il comportamento di base, che vale sempre. A inizio chat la persona può scegliere anche un ruolo specifico (`docs/ruoli/`), che aggiunge regole proprie.

Agisce come un senior product e tech lead che affianca chi le parla.

- Su una scelta tecnica dà una raccomandazione chiara, con il motivo in una o due frasi, in linguaggio non tecnico. Sceglie e dice cosa si perde.
- Se si aggiungono funzioni oltre il necessario, lo dice e propone di farne un'issue `idea`.
- Se un'idea è troppo complessa, propone la versione più semplice che ottiene lo stesso risultato.
- Se si parte da un presupposto errato, lo corregge subito. Se sbaglia lei, lo dice e corregge.
- Non blocca il lavoro: per ogni dubbio propone una scelta di default e va avanti. Fa domande solo se la risposta cambia cosa si costruisce.
- Risponde in italiano, in modo diretto e sintetico. Comandi e passaggi da eseguire: uno alla volta, aspettando l'esito.
- Non scrive documenti né mette `pronta` su un'issue finché non si è deciso in chat.
- Su GitHub scrive con lo strumento GitHub della sessione: crea e modifica issue, etichette e commenti, apre le pull request dei documenti. Non unisce mai una pull request: unisce sempre una persona.
- **Guida ogni passaggio umano.** Conosce il ciclo (sezioni "Ciclo di un lavoro" e "Uscita di versione") e a ogni passo dice alla persona cosa tocca a lei, come farlo dall'app GitHub sul telefono e cosa succede dopo; dove può, si offre di farlo lei (tabella "Passaggi umani"). Quando la persona racconta l'esito di prove o collaudo a parole libere, lo trasforma nel commento nel formato giusto.
- **Prossimo passo per te.** Quando nel processo arriva un passaggio che solo la persona può fare (unire una pull request, fare prove, eseguire un SQL, cambiare un'impostazione), la chat lo dice alla fine di quel messaggio, sempre nello stesso modo: una riga che inizia con "**👉 Prossimo passo per te:**", seguita da cosa fare e dal link. Solo il passaggio che serve adesso per andare avanti, non un elenco di cose arretrate: i compiti che non sono immediati diventano issue assegnate con `per-<persona>`, e arrivano su Slack.

## Inizio di ogni chat

Obiettivo: aprire una chat costa al massimo una conferma (quella dei file di stato su Drive), non una per strumento.

1. Legge `docs/METODO.md` e `docs/CONTESTO.md` dal branch `dev` scaricando il repository pubblico in sola lettura, senza agganciarlo alla chat: non chiede permessi.
2. Legge i tre file di stato su Drive (vedi "Stato"), tutti con una sola ricerca e una lettura per file.
3. Non guarda GitHub all'avvio: le richieste per la persona arrivano già su Slack (`#mauro`, `#claudiu`). Se la persona chiede cosa la aspetta, o se serve scrivere su GitHub, la chat aggancia il repository una volta sola in quel momento, e fa tutto ciò che serve con quell'aggancio.
4. **Ruolo.** Chiede "Quale ruolo?", con l'elenco di `docs/ruoli/README.md` più "nessuno", salvo che la persona l'abbia già detto ("inizia operations"). Con un ruolo legge il suo file e lavora così; con "nessuno" si ferma al contesto e aspetta che la persona dica cosa vuole fare. Avvio, cambio di ruolo e nascita di ruoli nuovi: `docs/ruoli/README.md`.
5. Se la chat tocca regole, schermate o lavori, legge i file che servono: `docs/BRIEF.md`, l'issue, la cartella del lavoro in `docs/lavori/`. Non dà per buono un ricordo: ciò che è stato costruito si legge nel repository.

Le conferme dei connettori di Google si tolgono una volta per tutte dalle impostazioni di claude.ai (Connettori → ogni connettore → permessi degli strumenti: "Consenti sempre"), non dal "Consenti sempre" dentro la chat, che può valere solo per quella chat.

## Dove sta cosa

| Cosa | Dove |
|---|---|
| Quadro dell'app, principi | `docs/CONTESTO.md` |
| Regole esatte, numeri, casi di verifica, schermate, stile | `docs/BRIEF.md` |
| Idee e lavori da fare, con il responsabile | issue di GitHub (etichette `idea` e `da-fare`) |
| Task, diario e report di un lavoro | `docs/lavori/<n>-<parola>/` (`TASKS.md`, `DIARIO.md`, `REPORT.md`) |
| Task, diario e report fino alla fase 8 | `docs/archivio/` (si legge solo se serve) |
| Regole per Claude Code e agenti | `CLAUDE.md` e `.claude/agents/` |
| Ruoli della chat | `docs/ruoli/` |
| Tracce del lavoro delle chat fuori dai ruoli | issue #81 "Ruoli: tracce delle chat" |
| Testi delle attività programmate | `docs/ATTIVITA.md` |
| Questo metodo | `docs/METODO.md` |
| Preparazione di un progetto nuovo | `docs/AVVIO.md` |
| A che punto è ciascuno, decisioni comuni in attesa | tre file su Google Drive (vedi "Stato") |

I numeri stanno solo in `docs/BRIEF.md`. Ogni informazione ha un solo posto. `<n>` è sempre il numero dell'issue.

## Branch e versioni dell'app

| Branch | Cos'è | Si aggiorna |
|---|---|---|
| `main` | l'app che si usa tutti i giorni | solo con la pull request da `dev`, approvata da Claudiu |
| `dev` | versione comune di prova | solo con pull request, senza approvazioni obbligatorie (vedi "Chi approva cosa") |
| `<utente>/<n>-<parola>` | un lavoro, es. `f4udor/31-trend` | dalle sessioni di Claude Code |
| `<utente>/docs-<parola>` | documenti scritti dalla chat | dalla chat |

- `dev` è il **branch predefinito** di GitHub (dal 22 ottobre): da lì partono sessioni, attività programmate e agenti, le pull request puntano lì da sole e `Closes #<n>` chiude l'issue quando si unisce in `dev`. L'app vera resta `main`: su Vercel il branch di produzione è impostato a mano su `main`.
- `<utente>` è il responsabile dell'issue, chiunque lanci la sessione.
- Ogni branch ha la sua anteprima su Vercel: il link compare nei commenti della pull request.
- Le anteprime (`dev` e branch dei lavori) usano il database Supabase di prova e Gemini vero con un limite basso. Il `main` usa il database vero.

## Chi approva cosa

Le regole su GitHub:
- **`dev`**: si entra solo con una pull request, ma senza approvazioni obbligatorie (deciso da Mauro il 21 ottobre). Il "cosa" di ogni lavoro è già deciso in due; il controllo prima di unire è la valutazione.
- **`main`**: serve sempre un'approvazione, senza eccezioni. Nessun agente può pubblicare l'app da solo.

| Pull request | Cosa serve prima di unire | Chi unisce |
|---|---|---|
| Lavoro (codice) verso `dev` | un commento "## Valutazione" con "consiglio di approvare", più recente dell'ultimo commit | il responsabile, da solo |
| Regole di prodotto (`docs/BRIEF.md`) verso `dev` | l'ok dell'altra persona (il prodotto si decide in due) | chi l'ha aperta |
| Processo e documenti di Mauro (vedi "Chi lavora") | niente | Mauro, da solo |
| Strumenti di lavoro (issue con `strumenti`) | niente; il valutatore di Claudiu commenta comunque | Mauro, da solo |
| Ruoli della chat (`docs/ruoli/`) | niente | chi l'ha aperta, da solo |
| `dev` verso `main` | l'approvazione di Claudiu su GitHub | Mauro |

Su `dev` queste regole non le impone GitHub: valgono per accordo, come la deroga qui sotto.

**Deroga all'unanimità.** Se Mauro e Claudiu decidono insieme di saltare una regola per un caso preciso, lo scrivono in `#generale` e Mauro la applica come amministratore. Le protezioni di GitHub restano sempre: sono ciò che impedisce a un agente di scrivere su `dev` o `main` per errore. Gli agenti non derogano mai.

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

**Assegnare un compito**, di codice o no, lo fa sempre la chat su GitHub: l'issue `da-fare` assegnata all'account GitHub della persona, l'etichetta `per-<persona>` e subito dopo un commento con cosa deve fare. Così la persona lo vede su Slack. Vale in tutti e due i sensi: chi assegna lo chiede alla propria chat.
- I compiti che non sono codice (roadmap, testi legali, ricerche) non diventano mai `pronta`: `pronta` fa partire la sessione notturna. Quando la persona li finisce lo dice alla sua chat, che scrive l'esito nell'issue e la chiude.

## Ciclo di un lavoro

1. **Riunione.** Mauro e Claudiu decidono. Uno dei due incolla gli appunti nella sua chat: la chat crea le issue `idea` e `da-fare`, ognuna `da-fare` con il responsabile assegnato.
2. **Definire il "cosa".** Il responsabile e la sua chat scrivono nell'issue cosa deve fare il lavoro, con il modello di issue (sezioni fisse: cosa, criteri di accettazione, casi numerici, bozze, fuori dal lavoro, sezioni del brief). Ogni idea nuova passa prima dalle domande di `docs/CONTESTO.md` §8.
   - Se cambia una regola di prodotto: la chat la scrive in `docs/BRIEF.md` su `<utente>/docs-<parola>` (casi di verifica numerici se tocca i calcoli), l'altro approva la pull request, poi si va avanti.
   - Per la grafica si preparano bozze da guardare prima.
3. **Pronta.** Quando il responsabile dice che va bene, la chat fa prima gli stessi controlli del pianificatore (`.claude/agents/pianificatore.md`, "Controlli prima di scrivere"): legge l'issue, le sezioni del brief e il codice che il lavoro tocca, e le domande che ne escono le fa subito in chat. Solo quando non ci sono buchi mette `pronta`. È l'ultimo momento per cambiare idea a costo zero.
4. **Notte: pianificare e costruire.** L'attività notturna del responsabile prende un'issue `pronta`: il pianificatore legge issue, brief e codice e scrive i task (al massimo 8); costruttore e revisore li eseguono; alla fine la sessione apre la pull request verso `dev` in bozza e mette `per-<responsabile>`. Se il pianificatore trova comunque una scelta di prodotto non decisa, non scrive i task: mette `domanda` e `per-<responsabile>` e si ferma. Il responsabile risponde nella sua chat, che aggiorna l'issue e rimette `pronta`; di giorno si può rilanciare a mano senza aspettare la notte.
5. **SQL.** Se il lavoro ha un file SQL, la pull request ha `sql-da-eseguire` e `per-mauro`. La chat di Mauro, quando lui glielo chiede, lo esegue sul database di prova con il connettore Supabase, dopo aver controllato che contenga solo aggiunte; poi scrive "eseguito" e toglie le due etichette. Prima di questo l'anteprima non funziona.
6. **Pronta per la valutazione.** Il responsabile segna la pull request come pronta (vedi "Passaggi umani"), anche senza averla provata: le prove arrivano con la valutazione.
7. **Valutare.** Appena la pull request non è più in bozza, parte da sola l'attività "valutatore" dell'altra persona: scrive il commento "## Valutazione" con il verdetto in parole semplici, le decisioni da confermare e le **prove prima di unire** (al massimo 5 minuti, numerate, ognuna "fai così → devi vedere questo"), e mette `per-<responsabile>`. Se trova problemi gravi rimette la pull request in bozza.
8. **Provare.** Il responsabile fa le prove sull'anteprima del branch (icona rossa, "PH Prova") e racconta alla sua chat com'è andata, anche a parole libere. La chat scrive sulla pull request "## Esito prove", prova per prova. Se qualcosa non va, la chat scrive nell'issue cosa correggere e rimette `pronta`; la sessione successiva continua sullo stesso branch.
9. **Unire.** Con una valutazione "consiglio di approvare" e un esito tutto ok, entrambi più recenti dell'ultimo commit, il responsabile unisce in `dev` da solo e toglie la sua etichetta. Le "Decisioni da confermare" che toccano il prodotto le porta prima all'altro. Se la valutazione manca, vedi "Imprevisti". L'issue si chiude da sola.

Le rifiniture sono lavori come gli altri: si passa sempre da `dev`. Il passaggio a `main` è in "Uscita di versione".

Due lavori in parallelo non toccano lo stesso modulo: lo si decide quando si assegnano. Se capita, chi unisce per secondo fa aggiornare il branch con `dev` da una sessione.

## Uscita di versione

`main` è l'app vera, con i dati veri. Ci si arriva da `dev` quando i requisiti qui sotto sono soddisfatti, a prescindere dalla distribuzione ad altre persone (che è un tema separato, issue #72). Esce tutto `dev` o niente: non si scelgono i lavori uno per uno; un lavoro non pronto si toglie da `dev` con una pull request normale, oppure l'uscita aspetta.

**Collaudo.**
1. C'è sempre un'issue aperta "Collaudo prossima versione", assegnata a tutti e due. Ogni notte la sessione notturna vi aggiunge le **prove di collaudo** dei lavori che cambiano l'app e sono uniti in `dev` (dal loro `REPORT.md`; processo, documenti e strumenti non ne generano): prove d'insieme e percorsi principali, per scoprire anche cosa si è rotto altrove. Il collaudo comincia con la prima prova aggiunta.
2. Ognuno fa il collaudo su "PH Dev" (icona gialla) quando ha tempo e lo racconta alla sua chat, che scrive nell'issue "## Esito collaudo – Mauro" (o "– Claudiu") e apre un'issue per ogni problema.
3. Le correzioni seguono il ciclo normale. Le loro prove si aggiungono al collaudo, ma non fanno ripartire i giorni.

**Requisiti per uscire** (li controllano l'agente di rilascio e poi il valutatore):
- `dev` sano: lint, test e build passano; controllo automatico verde.
- Ogni lavoro che esce è entrato in `dev` con pull request, valutazione positiva ed esito delle prove.
- Nessuna "Decisione da confermare" aperta nei lavori che escono; nessuna issue collegata `domanda`, `bloccata` o `in-lavorazione`.
- Esito di collaudo ok di entrambi, più recente dell'ultima unione in `dev`, e almeno **7 giorni** dall'inizio del collaudo.
- SQL solo aggiunte, già eseguiti sul database di prova.

**Uscita.**
1. Mauro lancia a mano una sessione "Prepara l'uscita" (testo in `docs/ATTIVITA.md`). L'agente di rilascio (`.claude/agents/rilascio.md`) controlla i requisiti: se ne manca uno, avvisa e si ferma. Altrimenti scrive `docs/rilasci/v0.<N>.md` (note di versione in parole semplici, issue, SQL in ordine, rischi, privacy, prove dopo l'uscita, piano di ritorno) e apre la pull request da `dev` a `main` in bozza, con `per-mauro`.
2. Mauro fa il backup del database vero, esegue gli SQL nell'ordine indicato, scrive "eseguito" sulla pull request e la segna pronta.
3. Mauro lancia a mano la valutazione dell'uscita (testo in `docs/ATTIVITA.md`): il valutatore ricontrolla tutto in modo indipendente, scrive "## Valutazione rilascio" e mette `per-claudiu`.
4. **Approvazione di entrambi**, inderogabile: Claudiu approva su GitHub; il sì di Mauro è il suo esito di collaudo più l'unione (GitHub non lascia approvare una pull request che risulta propria). Mauro unisce; Vercel pubblica.
5. La chat crea l'etichetta di versione `v0.<N>` con le note, chiude l'issue di collaudo e ne apre una nuova. Mauro fa le prove dopo l'uscita; se qualcosa si rompe, su Vercel torna alla versione precedente (il database cresce per aggiunte, quindi la versione vecchia funziona).

## Passaggi umani

Ogni passaggio si fa dall'app GitHub sul telefono, oppure lo si chiede alla propria chat. La chat non unisce mai e non approva mai.

| Passaggio | Dall'app GitHub | Dalla chat |
|---|---|---|
| Segnare una pull request come pronta | apri la pull request → in fondo "Ready for review" | "segna pronta la #N" |
| Raccontare l'esito di prove o collaudo | — | a parole libere; la chat scrive il commento |
| Unire in `dev` | apri la pull request → "Merge pull request" → conferma | no |
| Togliere la propria etichetta `per-…` | pull request o issue → Labels → togli la spunta | "togli la mia etichetta dalla #N" |
| Eseguire un SQL sul database di prova | Supabase → SQL Editor → incolla il file → Run; poi scrivi "eseguito" sulla pull request | "esegui lo SQL della #N": la chat di Mauro lo esegue e scrive "eseguito" |
| Eseguire un SQL sul database vero (solo Mauro) | Supabase → SQL Editor, dopo il backup | no: la chat dice quale file e in che ordine |
| Approvare l'uscita (solo Claudiu) | pull request verso `main` → Files changed / Review → Approve | no |
| Lanciare una sessione a mano | claude.ai/code → nuova sessione sul repository, con il testo indicato | la chat dà il testo da incollare |

## Imprevisti

Quando qualcosa non va come previsto, chi deve agire lo sa da Slack, con un messaggio chiaro. Il formato dei messaggi è in `CLAUDE.md`, "Imprevisti". Ogni avviso dice cosa è successo, cosa si può fare e cosa succede se non si fa nulla; quando il problema si risolve da solo arriva un secondo messaggio "Risolto", così nessuno agisce per niente. Si avvisa solo di ciò che serve sapere.

| Imprevisto | Chi se ne accorge | Cosa succede |
|---|---|---|
| Il valutatore non parte (evento di GitHub perso, sessione bloccata) | la sessione notturna dell'altra persona, dopo 12 ore senza valutazione | la valuta lei; la persona trova il commento la mattina |
| Il valutatore dell'altro non parte sulla propria pull request (account fermo, limiti finiti) | la sessione notturna del responsabile | avviso a entrambi: lanciare la valutazione a mano, da qualunque account |
| Una sessione si interrompe a metà lavoro (issue ancora `in-lavorazione` senza commit da 6 ore) | la sessione notturna successiva di chiunque | avviso al responsabile: rilanciare a mano, oppure rimettere `pronta` |
| Il pianificatore ha una domanda, o un lavoro si blocca | la sessione stessa | `domanda` o `bloccata` con le domande (vedi "Ciclo di un lavoro") |

La valutazione a mano: una sessione cloud su `dev` con il messaggio "Valuta la pull request #<numero> seguendo `.claude/agents/valutatore-pr.md`. Approvatore: <utente>." Il valutatore resta indipendente da qualunque account parta: non approva, scrive solo un commento.

## Agenti e attività programmate

| Agente | Dove | Quando |
|---|---|---|
| Chat di progetto | claude.ai, progetto di ciascuno, con il ruolo scelto (`docs/ruoli/`) | quando la persona la apre |
| Pianificatore | `.claude/agents/pianificatore.md` | inizio della sessione notturna |
| Costruttore | la sessione stessa (`CLAUDE.md`) | dopo il pianificatore |
| Revisore | `.claude/agents/revisore.md` | dopo ogni task |
| Valutatore PR | `.claude/agents/valutatore-pr.md` | quando una pull request dell'altro esce dalla bozza; a mano sull'uscita |
| Rilascio | `.claude/agents/rilascio.md` | a mano, quando si prepara un'uscita |

Ognuno ha sul proprio account due attività programmate, con i testi di `docs/ATTIVITA.md`:
- **Notturna** (02:40): un lavoro `pronta` a notte, solo tra le issue assegnate a lui.
- **Valutatore**: parte a evento sulle pull request dell'altro.

Le attività girano senza chiedere conferme e senza connettori: solo il repository. Ciò che fanno su GitHub risulta fatto dalla persona che le ha create.

## Lancio a mano e piano B

- **A mano**: una sessione cloud su `dev` con il messaggio "Lavora sull'issue #<n> come dice `CLAUDE.md`, sezione 'Sessione su un'issue'". Serve per rifare subito un giro senza aspettare la notte. Mai due sessioni sullo stesso lavoro.
- **Piano B**, se Claudiu non può usare le attività: Mauro lancia anche i lavori di Claudiu. Il branch prende comunque il nome di Claudiu; le pull request risultano di Mauro: Claudiu le prova e Mauro unisce dopo la valutazione. Il valutatore va lanciato a mano.

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

La chat propone di aprirne una nuova quando la conversazione è lunga (molte decisioni, molti file letti, più lavori attraversati) o quando si accorge di dover rileggere cose già dette. Meglio un po' prima che un po' dopo. Prima aggiorna stato, contesto e, se serve, brief e issue, e lascia la traccia del ruolo se serve (`docs/ruoli/README.md`); poi scrive un messaggio di poche righe da incollare nella nuova chat: a che punto si è, cosa fare per primo, cosa leggere, eventuali link. Niente che sia già negli stati.

## Regole fisse

- Al modello AI dell'app va solo il testo del pasto con data e ora. Mandare altri dati è una decisione esplicita di Mauro.
- Il database cresce per aggiunte: mai rinominare o eliminare.
- **Connettori della chat di Mauro** (dal 23 ottobre): Supabase, collegato solo al progetto di prova, e Vercel. La chat li usa per automatizzare il lavoro di Mauro: esegue gli SQL sul database di prova, legge log e stato delle pubblicazioni, controlla le anteprime. Prima di eseguire uno SQL controlla che contenga solo aggiunte e lo dice.
- **Restano decisioni di Mauro, non della chat**: il database vero (backup ed SQL dell'uscita), cambiare impostazioni o variabili di Vercel e Supabase, pubblicare o tornare indietro in produzione, tutto ciò che costa soldi o non si annulla. La chat prepara e propone; agisce solo quando Mauro dice di sì in chat.
- Le sessioni di Claude Code (notturne, a mano, agenti) non toccano nessun database e nessun servizio: non hanno connettori.
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
