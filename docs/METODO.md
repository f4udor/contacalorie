# Metodo di lavoro

Regole per la chat che progetta l'app (il progetto Claude di Mauro e quello di Claudiu). Le regole per le sessioni di Claude Code che scrivono il codice stanno in `CLAUDE.md`.

## Chi lavora

- **Mauro** (GitHub `f4udor`) e **Claudiu** (GitHub `niss23`). Nessuno dei due scrive codice: il codice lo scrive solo Claude Code.
- Ognuno ha la sua chat di progetto, le sue sessioni di Claude Code e il suo credito.
- La chat agisce come un senior product e tech lead: su una scelta tecnica dà una raccomandazione chiara, con il motivo in una o due frasi, in linguaggio non tecnico, e dice cosa si perde.

## Dove sta cosa

| Cosa | Dove |
|---|---|
| Quadro dell'app, principi, idee future | `contesto-progetto.md`, nel progetto Claude di ciascuno |
| Regole esatte, numeri, casi di verifica, schermate, stile | `docs/BRIEF.md` |
| Lavoro da fare e fatto, fase per fase | `docs/TASKS.md` |
| Decisioni degli agenti e cose non verificate | `docs/DIARIO.md` e `docs/REPORT-FASE-*.md` |
| Regole per Claude Code | `CLAUDE.md` e `.claude/agents/revisore.md` |
| Questo metodo | `docs/METODO.md` |

I numeri stanno solo in `docs/BRIEF.md`. Non dare per buono un ricordo: ciò che è stato costruito si legge nel repository.

## Branch e versioni dell'app

| Branch | Cos'è | Si aggiorna |
|---|---|---|
| `main` | l'app che si usa tutti i giorni | solo portandoci `dev`, quando entrambi hanno provato |
| `dev` | versione comune di prova | solo con pull request approvate dall'altra persona |
| `f4udor/…`, `niss23/…` | lavoro di ciascuno, una fase per branch | dalle sessioni di Claude Code |

- Ogni branch ha la sua anteprima su Vercel: il link compare nei commenti della pull request.
- Le anteprime (`dev` e branch personali) usano il database Supabase di prova e Gemini vero con un limite basso. Il `main` usa il database vero.

## Ciclo di una fase

1. **Annunciare.** Chi apre una fase prende il numero successivo e lo scrive nel gruppo ("prendo la fase N: …"), così nessuno lavora sulla stessa cosa.
2. **Decidere.** La modifica si discute in chat finché chi la propone la approva. Ogni idea nuova passa prima dalle domande di `contesto-progetto.md` §8. Per la grafica si preparano bozze da guardare prima dei task.
3. **Scrivere.** La chat scrive solo documenti, su un branch `<utente>/docs-fase-N` partito da `dev`: la regola in `docs/BRIEF.md` (con casi di verifica numerici se tocca i calcoli) e i task in `docs/TASKS.md` come nuova fase, con la riga `Di: <utente GitHub>`. Pull request verso `dev`.
4. **Approvare.** L'altra persona approva la pull request dei documenti, poi chi l'ha aperta la unisce. Le regole del prodotto si decidono in due.
5. **Lanciare.** Un messaggio breve da incollare in una nuova sessione cloud di Claude Code: quale fase eseguire, rimando a `CLAUDE.md`. Mai i task dentro il messaggio.
6. **Controllare.** A fine sessione la chat legge il report e la pull request: riesegue i test, legge l'eventuale SQL riga per riga, guarda le schermate. Dice cosa ha verificato e cosa no.
7. **Provare e approvare.** Si prova l'anteprima del branch. Se c'è un SQL, va eseguito prima sul Supabase di prova. L'altra persona prova e approva; chi ha aperto la pull request la unisce in `dev`, e lo scrive nel gruppo.
8. **Portare nel main.** Quando entrambi hanno provato `dev`, Mauro esegue gli SQL sul Supabase vero, poi si apre e si unisce la pull request da `dev` a `main`. Vercel ripubblica da solo.

## Regole fisse

- Al modello AI dell'app va solo il testo del pasto con data e ora. Mandare altri dati è una decisione esplicita di Mauro.
- Il database cresce per aggiunte: mai rinominare o eliminare.
- Niente si costruisce su ipotesi non verificate: se un punto è incerto, prima si prova.
- Prezzi, limiti e condizioni dei servizi esterni si verificano online prima di darli per buoni.
- Ogni proposta tiene conto del costo: una fase che tocca tutte le schermate costa molto più di una mirata.
- Nessuno unisce una pull request propria senza l'approvazione dell'altro. Nessuno scrive direttamente su `dev` o `main`.

## Comunicazione

Un gruppo WhatsApp tra Mauro e Claudiu. Quattro tipi di messaggio:

- "prendo la fase N: …";
- "pull request pronta da provare", con il link;
- "unito in dev";
- le decisioni da prendere in due.
