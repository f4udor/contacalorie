# Metodo di lavoro

Regole per le persone e per la chat che progetta l'app (il progetto Claude di Mauro e quello di Claudiu). Le regole per le sessioni di Claude Code stanno in `CLAUDE.md` e in `.claude/agents/`; il metodo generico della pipeline dev in `docs/dev/METODO-DEV.md`; ciò che è specifico di questo prodotto in `docs/DEV-PRODOTTO.md`. Come si prepara un progetto nuovo: `docs/AVVIO.md`.

## Chi lavora

- **Mauro** (GitHub `f4udor`) e **Claudiu** (GitHub `NIss-gif`). Nessuno dei due scrive codice e nemmeno la chat: il codice lo scrive solo Claude Code. Le persone giudicano schermate e comportamento.
- Ognuno ha la sua chat di progetto, le sue sessioni di Claude Code e i limiti del suo piano.
- **Il prodotto si decide in due**: regole, numeri, schermate (`docs/BRIEF.md`).
- **Il processo è di Mauro**: questo documento, `CLAUDE.md`, `.claude/agents/`, `docs/dev/`, `docs/DEV-PRODOTTO.md`, `docs/ATTIVITA.md`, `docs/AVVIO.md`, le guide `docs/COLLEGA-*.md`. Mauro li cambia e unisce da solo; Claudiu li legge. Sono di Mauro anche gli **strumenti di lavoro**: codice che serve solo a come si lavora (anteprime, icone delle versioni di prova, script di prova) e non cambia l'app vera; le loro issue hanno l'etichetta `strumenti`. Fanno eccezione i ruoli della chat (`docs/ruoli/`): ognuno crea e modifica i suoi e li unisce da solo.
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
- **Guida ogni passaggio umano.** Conosce il ciclo (`docs/dev/METODO-DEV.md`, sezioni "Ciclo di un lavoro" e "Collaudo e uscita di versione") e a ogni passo dice alla persona cosa tocca a lei, come farlo dall'app GitHub sul telefono e cosa succede dopo; dove può, si offre di farlo lei (tabella "Passaggi umani" dello stesso file). Quando la persona racconta l'esito di prove o collaudo a parole libere, lo trasforma nel commento nel formato giusto.
- **Prossimo passo per te.** Quando nel processo arriva un passaggio che solo la persona può fare (unire una pull request, fare prove, eseguire un SQL, cambiare un'impostazione), la chat lo dice alla fine di quel messaggio, sempre nello stesso modo: una riga che inizia con "**👉 Prossimo passo per te:**", seguita da cosa fare e dal link. Solo il passaggio che serve adesso per andare avanti, non un elenco di cose arretrate: i compiti che non sono immediati diventano issue assegnate con `per-<persona>`, e arrivano su Slack.

## Inizio di ogni chat

Obiettivo: aprire una chat costa al massimo una conferma (quella dei file di stato su Drive), non una per strumento.

1. Legge `docs/METODO.md` e `docs/CONTESTO.md` dal branch `dev` scaricando il repository pubblico in sola lettura, senza agganciarlo alla chat: non chiede permessi.
2. Legge i tre file di stato su Drive (vedi "Stato"), tutti con una sola ricerca e una lettura per file.
3. Non guarda GitHub all'avvio: le richieste per la persona arrivano già su Slack (`#mauro`, `#claudiu`). Se la persona chiede cosa la aspetta, o se serve scrivere su GitHub, la chat aggancia il repository una volta sola in quel momento, e fa tutto ciò che serve con quell'aggancio.
4. **Ruolo.** Chiede "Quale ruolo?", con l'elenco di `docs/ruoli/README.md` più "nessuno", salvo che la persona l'abbia già detto ("inizia operations"). Con un ruolo legge il suo file e lavora così; con "nessuno" si ferma al contesto e aspetta che la persona dica cosa vuole fare. Avvio, cambio di ruolo e nascita di ruoli nuovi: `docs/ruoli/README.md`.
5. Se la chat tocca regole, schermate o lavori, legge i file che servono: `docs/BRIEF.md`, l'issue, la cartella del lavoro in `docs/lavori/`. Non dà per buono un ricordo: ciò che è stato costruito si legge nel repository.

Le conferme dei connettori di Google si tolgono una volta per tutte dalle impostazioni di claude.ai (Connettori → ogni connettore → permessi degli strumenti: "Consenti sempre"), non dal "Consenti sempre" dentro la chat, che può valere solo per quella chat.

## Ciclo di un lavoro, uscita e regole di GitHub

Branch, chi approva cosa, etichette, ciclo di un lavoro, collaudo e uscita di versione, passaggi umani, imprevisti e agenti sono regole generiche della pipeline dev, uguali per ogni prodotto: stanno in `docs/dev/METODO-DEV.md` (copia di `hustle/pipeline/07-dev/METODO-DEV.md`, da non modificare a mano). Le parti che dipendono da Personal Health (account, comandi, anteprime, database, uscita) stanno in `docs/DEV-PRODOTTO.md`.

Specifico di Personal Health:
- **`dev` è il branch predefinito** di GitHub: da lì partono sessioni e agenti, le pull request puntano lì da sole e `Closes #<n>` chiude l'issue quando si unisce. L'app vera resta `main` (produzione su Vercel, impostata a mano).
- **Le sessioni le lancia una persona**, a mano, con i testi di `docs/ATTIVITA.md`. L'avvio programmato (per esempio di notte) è solo una modalità opzionale, non una regola del metodo.
- **Il valutatore** è l'unica attività automatica: parte da solo quando una pull request dell'altra persona esce dalla bozza (impostazione in `docs/ATTIVITA.md`).
- **Piano B**, se Claudiu non può usare le attività: Mauro lancia anche i lavori di Claudiu. Il branch prende comunque il nome di Claudiu; le pull request risultano di Mauro: Claudiu le prova e Mauro unisce dopo la valutazione. Il valutatore va lanciato a mano.

## Dove sta cosa

| Cosa | Dove |
|---|---|
| Quadro dell'app, principi | `docs/CONTESTO.md` |
| Regole esatte, numeri, casi di verifica, schermate, stile | `docs/BRIEF.md` |
| Idee e lavori da fare, con il responsabile | issue di GitHub (etichette `idea` e `da-fare`) |
| Task, diario e report di un lavoro | `docs/lavori/<n>-<parola>/` (`TASKS.md`, `DIARIO.md`, `REPORT.md`) |
| Task, diario e report fino alla fase 8 | `docs/archivio/` (si legge solo se serve) |
| Regole per Claude Code e agenti | `CLAUDE.md` e `.claude/agents/` (copie dalla pipeline generica) |
| Metodo generico di sviluppo (rami, etichette, ciclo, uscita) | `docs/dev/METODO-DEV.md` |
| Parti specifiche di questo prodotto per gli agenti | `docs/DEV-PRODOTTO.md` |
| Ruoli della chat | `docs/ruoli/` |
| Tracce del lavoro delle chat fuori dai ruoli | issue #81 "Ruoli: tracce delle chat" |
| Testi delle attività programmate | `docs/ATTIVITA.md` |
| Questo metodo | `docs/METODO.md` |
| Preparazione di un progetto nuovo | `docs/AVVIO.md` |
| A che punto è ciascuno, decisioni comuni in attesa | tre file su Google Drive (vedi "Stato") |

I numeri stanno solo in `docs/BRIEF.md`. Ogni informazione ha un solo posto. `<n>` è sempre il numero dell'issue.

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
- Le sessioni di Claude Code (a mano, agenti) non toccano nessun database e nessun servizio: non hanno connettori.
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
