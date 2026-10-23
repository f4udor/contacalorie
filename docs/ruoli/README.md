# Ruoli della chat

Una chat di progetto può lavorare con un **ruolo**: un modo di lavorare preciso (cosa legge in più, cosa fa, cosa non fa) per un tipo di conversazione che torna spesso. I ruoli valgono per le chat dei progetti Claude di Mauro e di Claudiu. Gli agenti di Claude Code sono un'altra cosa e stanno in `.claude/agents/`.

Il comportamento di base vale sempre, con o senza ruolo: `docs/METODO.md`, "Ruolo della chat". Un ruolo aggiunge, non toglie.

## Ruoli attivi

| Ruolo | Per cosa | Creato da |
|---|---|---|
| [development](development.md) | accompagnare Mauro e Claudiu nel ciclo di un lavoro, dall'idea all'unione in `dev` e all'uscita | Mauro, 23 ottobre 2026 |
| [operations](operations.md) | processo, automazioni, strumenti e connettori: come lavoriamo, non cosa costruiamo | Mauro, 23 ottobre 2026 |

## Avvio

1. La persona scrive **"inizia"**. La chat legge contesto e file di stato come dice `docs/METODO.md`, "Inizio di ogni chat".
2. Chiede: "Quale ruolo? development, operations, oppure nessuno", con l'elenco preso dalla tabella qui sopra.
3. Con un ruolo: legge il suo file e ciò che il file dice di leggere in più, poi lavora in quel ruolo. Con **nessuno**: si ferma al contesto e aspetta che la persona dica cosa vuole fare.

Scorciatoia: "inizia operations" salta la domanda. Il ruolo resta lo stesso per tutta la chat, salvo che la persona dica "cambia ruolo" o "passa a <ruolo>": allora la chat legge il file nuovo e lo dice in una riga.

## Come nascono i ruoli

Un ruolo nasce da lavoro che si ripete, mai da un'ipotesi: ciò che capita una volta sola non diventa un ruolo.

1. **Tracce.** Quando una chat fa un lavoro sostanzioso (una decisione, un documento, una discussione di più scambi) **senza ruolo o fuori dal suo ruolo**, lascia una traccia come commento nell'issue aperta "Ruoli: tracce delle chat" (#81). La lascia nei momenti in cui aggiorna il file di stato o propone di cambiare chat, una sola per chat. Formato:
   `<data> · <persona> · ruolo: <ruolo o nessuno> · <che lavoro, in una riga> · <documenti letti o scritti>`
2. **Schema che si ripete.** Quando lascia una traccia, la chat rilegge quelle precedenti. Se almeno **tre** tracce, anche di persone diverse, descrivono lo stesso tipo di lavoro, propone in due righe un ruolo nuovo: nome, per cosa, da quali tracce nasce.
3. **Correzioni.** Se in un ruolo la chat si accorge che il file è sbagliato o incompleto (la persona la corregge, o deve leggere sempre qualcosa che il file non dice), propone la modifica nello stesso momento.
4. **Decisione.** Se la persona dice sì, la chat scrive il file del ruolo (o la modifica) su un branch `<utente>/docs-ruolo-<nome>` e apre la pull request verso `dev`. Nel testo cita le tracce da cui nasce.

## Chi decide

- Ognuno crea e modifica i ruoli e unisce da solo la pull request, senza l'approvazione dell'altro: Mauro e Claudiu hanno competenze diverse e ognuno crea i ruoli che gli servono.
- Chi modifica un ruolo creato dall'altro lo scrive in `#generale`.
- Un ruolo non cambia le regole di `docs/METODO.md` né di `CLAUDE.md`: se per funzionare servirebbe cambiarle, è una proposta di processo e la decide Mauro.

## Com'è fatto un file di ruolo

Nome del file in inglese, minuscolo (`operations.md`); testo in italiano. Sezioni fisse, brevi:

- **Per cosa**: in una o due frasi, quando si sceglie questo ruolo.
- **Legge in più all'avvio**: oltre al contesto comune. Solo ciò che serve sempre; il resto si legge quando serve.
- **Cosa fa**.
- **Cosa non fa**: dove finisce il ruolo e a quale ruolo passa la palla.
- **Dove scrive**.
