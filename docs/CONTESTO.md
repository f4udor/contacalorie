# Personal Health: descrizione dell'app e requisiti

Documento statico, in `docs/CONTESTO.md`: dice cos'è l'app, cosa deve fare e con quali regole si fa crescere. Non contiene avanzamento, budget o storia. I numeri esatti delle regole stanno nel repository (vedi sezione 2): qui c'è il quadro, là il dettaglio.

## 1. Cos'è

App personale di Mauro per tracciare dieta e attività fisica: calorie e nutrienti dei pasti, passi, bici, peso. La usa anche un suo amico, aggiunto da Mauro. Non è un prodotto da vendere. Dal 20 ottobre 2026 Mauro (GitHub `f4udor`) la sviluppa insieme a Claudiu (GitHub `niss23`). Nessuno dei due scrive codice: l'app è costruita da Claude Code e deve restare semplice da capire e da mantenere.

- App pubblicata: contacalorie-rho.vercel.app
- Repository: f4udor/contacalorie

Contesto d'uso di Mauro: dieta ipocalorica, bici 100-150 km a settimana registrata con Strava, niente Apple Watch, uso da iPhone e da computer con gli stessi dati. Strategia: tenere sempre un margine di deficit nutrendosi bene.

## 2. Dove sta cosa

Ogni informazione ha un solo posto. Se due posti dicono cose diverse, vale quello indicato qui.

| Cosa | Dove | Chi lo aggiorna |
|---|---|---|
| Quadro dell'app, principi | `docs/CONTESTO.md` (questo documento) | la chat, con pull request, quando cambia un requisito |
| Idee e lavori da fare | issue di GitHub (`idea`, `da-fare`) | la chat |
| Regole esatte, numeri, casi di verifica, schermate, stile | `docs/BRIEF.md` nel repository | la chat, con pull request |
| Task di un lavoro | `docs/lavori/<n>-<parola>/TASKS.md` | il pianificatore scrive i task, Claude Code segna lo stato |
| Decisioni prese dagli agenti e cose non verificate | `docs/lavori/<n>-<parola>/DIARIO.md` e `REPORT.md`; fino alla fase 8 in `docs/archivio/` | Claude Code |
| Regole di lavoro degli agenti e attività programmate | `CLAUDE.md`, `.claude/agents/`, `docs/ATTIVITA.md` | la chat di Mauro, con pull request |
| Metodo di lavoro in due: lavori, branch, approvazioni | `docs/METODO.md` nel repository | la chat di Mauro, con pull request |
| Bozze grafiche approvate | `docs/design/` | la chat |
| Guide ai collegamenti (Supabase, Vertex, Salute) | `docs/COLLEGA-*.md` | Claude Code |
| A che punto è ciascuno, decisioni comuni in attesa | tre file di stato su Google Drive (`docs/METODO.md`, "Stato") | le chat, nei momenti indicati lì |

Per sapere com'è fatta una regola si legge `docs/BRIEF.md`, non questo documento.

## 3. Principi

1. **Modularità.** Si aggiungono moduli senza toccare la logica di fondo.
   - Il motore dei calcoli è isolato, fatto di funzioni pure e coperto da test.
   - Ogni funzione è un modulo con i propri dati; un modulo non dipende da un altro.
   - Le schermate leggono e scrivono solo tramite uno sportello dei dati unico.
   - Ogni chiamata all'AI passa da un punto unico, con provider intercambiabile.
   - Il database cresce per aggiunte: mai rinominare o eliminare ciò che esiste.
2. **Semplicità.** Versioni piccole e solide. Si toglie prima di aggiungere.
3. **Calcoli deterministici.** Obiettivi e regole sono formule testate. L'AI stima solo il contenuto dei piatti: non decide mai obiettivi, limiti o colori. Dove l'app conosce già i numeri (preferiti, tabelle), l'AI riconosce e l'app calcola; se bastano i numeri dell'app, l'AI non si chiama.
4. **Automazioni solide.** Ciò che è automatico si ripara da solo o avvisa quando si rompe.
5. **Riservatezza.** Al modello AI va solo il testo del pasto con data e ora (nella scheda del piatto: nome, peso e ingredienti scritti dall'utente), compresi i nomi dei preferiti che l'utente vi inserisce come etichetta (mai i loro numeri). Ogni utente vede solo i propri dati.
6. **Cura grafica.** Aspetto da app Apple, nessun difetto visivo, comandi che dicono esattamente cosa fanno; i comandi non cambiano posto quando cambia il contenuto.

## 4. Come funziona

Dettaglio e numeri in `docs/BRIEF.md` §3.

- **Obiettivo del giorno** = base + bonus attività − recupero. La base è scritta a mano dall'utente oppure calcolata dal profilo.
- **Obiettivi calcolati dal profilo**: da sesso, età, altezza e peso si ricava il metabolismo basale; da peso obiettivo e data, quante kcal togliere al giorno. La base non scende mai sotto il basale: se il piano lo richiederebbe, l'app propone la prima data possibile. Il fabbisogno è calcolato come giornata sedentaria, perché l'attività conta a parte.
- **Bonus attività**: metà delle kcal bruciate con bici e passi torna nell'obiettivo del giorno; l'altra metà resta come margine. I passi contano solo oltre una soglia.
- **Recupero**: la settimana va da lunedì a domenica. Uno sforo si recupera nei giorni dopo con correzioni piccole (tetto giornaliero), solo se supera una soglia minima; i giorni sotto obiettivo creano un margine limitato che assorbe gli sgarri successivi. Tutto si azzera il lunedì. Il saldo mostrato conta solo i giorni conclusi e c'è solo nella vista settimanale.
- **Pasto libero**: uno a settimana, segnato sul pasto intero, con un tetto alle kcal contate. Gli altri sgarri contano per intero.
- **Nutrienti**: proteine dal peso obiettivo, grassi come quota della base, carboidrati come resto (quindi salgono nei giorni di bici), fibre minime, sale massimo. Ognuno con un semaforo.
- **Anello delle kcal**: in corso, in obiettivo, attenzione, fuori, secondo la distanza dall'obiettivo. La fascia "in obiettivo" arriva fino alla soglia da cui scatta il recupero.
- **Giorni nel budget** (Trend, mese e anno): i giorni conclusi rimasti entro quella stessa soglia.
- **Coerenza delle stime**: se le kcal stimate dall'AI sono troppo basse rispetto ai nutrienti dichiarati, il piatto viene segnalato.
- **Peso**: la variazione è giudicata rispetto al peso obiettivo, in qualunque direzione.

## 5. Funzioni

### Utenti
- Accesso con email e codice di 6 cifre. Registrazioni chiuse: i nuovi utenti li aggiunge Mauro da Supabase.
- Primo avvio guidato: profilo completo, poi l'app mostra gli obiettivi calcolati.

### Pasti
- Un pasto (colazione, pranzo, cena, spuntino) è fatto di uno o più piatti.
- **Con l'AI**: una frase scritta o dettata diventa uno o più pasti con piatti separati. Il nome è solo il nome del piatto; gli ingredienti sono elencati con i grammi. Pasta, riso, cereali e legumi secchi si intendono a crudo salvo indicazione contraria, e l'interpretazione è sempre visibile. Quantità non dette: porzioni standard, segnate come ipotizzate, senza domande. Stessa frase, stessa stima. Nulla si salva senza conferma.
- **A mano**: nome e peso in cima, ingredienti facoltativi, numeri facoltativi; "Stima con l'AI" stima per il peso scritto. Niente porzioni.
- **Una sola scheda** per aggiungere e modificare un piatto, con lo stesso selettore AI | Manuale e "Salva" in alto.
- **Correzione** a parole ("era di più") o ritoccando i numeri.
- **Peso del piatto** facoltativo: permette di cambiare la quantità ricalcolando i numeri in proporzione, senza AI.
- **Pasto libero**: interruttore su ogni pasto della proposta, già acceso se detto nella frase; dopo, si segna o si toglie da Trend. Non sta nella scheda del piatto.
- **Preferiti**: piatti singoli e pasti interi, salvati come copie indipendenti con il loro peso (chiesto quando manca). Si riaggiungono dal tasto "Preferiti" nel campo dell'AI, si modificano (i piatti) e si eliminano scorrendo, non si duplicano.
- **Preferiti nella frase**: un preferito si inserisce come etichetta nel campo dell'AI, con la quantità ("150 g", "2 porzioni"). Il modello capisce solo dove va e quanto; i numeri li calcola l'app in proporzione al peso salvato. Con sole etichette e quantità l'AI non si chiama.

### Attività
- Passi e km in bici arrivano da Salute tramite un Comando rapido su iPhone, più volte al giorno. Per la bici il comando legge i km scritti in Salute da Strava.
- Passi: solo da Salute, in sola lettura.
- Bici: i km da Salute non si modificano. A mano si aggiunge un valore al giorno, che si somma e si può modificare o eliminare.
- Se da più di un giorno non arriva nulla, l'app lo segnala con un avviso.

### Peso e Trend
- Pesata periodica con storico.
- Trend: viste Settimana, Mese e Anno. Calorie con linea dell'obiettivo e della media (toccando una barra si leggono le kcal, toccando il numero si apre il giorno o il mese), saldo (solo settimana) o giorni nel budget (mese e anno), medie, passi, bici, peso, pasto libero. Le schede settimanali si aprono nel loro dettaglio.

### Impostazioni
- A sezioni: Profilo, Obiettivi, Attività, Pasto libero, Dati e, staccata, Collegamenti (Salute e modello AI). Nessun campo delicato raggiungibile per sbaglio. Esportazione dei dati in CSV.

## 6. Stile

Dettaglio in `docs/BRIEF.md` §10, bozze in `docs/design/`.

- Solo tema scuro, nero pieno, ispirato all'app Fitness di Apple. Schede opache con angoli ampi.
- Vetro solo su barra in basso, tasto + e intestazione che resta in alto.
- **Un colore, un significato**: verde lime per i comandi e la giornata in corso; blu per "in obiettivo"; giallo e rosso per attenzione e fuori; grigio per un giorno chiuso sotto obiettivo; viola per i passi; arancione per la bici.
- Numeri in carattere arrotondato a peso medio, unità piccole in maiuscolo.
- Barra con due voci (Oggi, Trend), tasto + sospeso, Impostazioni dietro l'ingranaggio.
- Elenchi raggruppati, tasti a pillola, pannelli che salgono con X a sinistra e azione principale a destra.

## 7. Architettura

- **App**: web app Next.js installabile sulla Home dell'iPhone, usabile da computer.
- **Hosting**: Vercel. Il `main` è l'app vera e si ripubblica da solo a ogni merge; `dev` (versione comune di prova) e ogni branch personale hanno un'anteprima. Dettaglio in `docs/METODO.md`.
- **Database e accesso**: Supabase (Postgres, Irlanda). Email con il codice inviate tramite SMTP di Gmail. Le anteprime usano un secondo progetto Supabase di prova. Le modifiche al database si eseguono a mano da un file SQL per fase: sul database di prova prima di unire in `dev`, su quello vero prima di portare `dev` nel `main`.
- **AI**: Gemini su Vertex AI, chiamato solo dal server, con limite giornaliero per utente. Modello configurabile dal server.
- **Automazioni**: Comandi rapidi su iPhone, perché Salute e Promemoria non sono raggiungibili da un server. Comando "stupido", logica nel server; ogni utente ha un codice personale; invii ripetuti senza doppioni.
- **Codice**: motore dei calcoli, moduli, sportello dei dati, schermate, ciascuno nella sua cartella (regole in `CLAUDE.md`).

## 8. Come si aggiunge un'idea nuova

Ogni idea, prima di diventare un task, passa da queste domande. Se una risposta è "no", l'idea si ridimensiona o resta un'issue `idea`.

1. **Serve davvero all'uso quotidiano?** Se è un "sarebbe bello", resta un'issue `idea`.
2. **Qual è la versione più piccola che dà lo stesso risultato?** Si parte da quella.
3. **In quale modulo vive?** Uno esistente o uno nuovo. Non deve obbligare un modulo a dipendere da un altro.
4. **Tocca i calcoli?** Se sì: regola scritta nel brief con casi di verifica numerici, e formula nel motore. Mai lasciata all'AI.
5. **Tocca il database?** Solo aggiunte, con il file SQL della fase.
6. **Manda dati nuovi fuori dall'app** (all'AI o ad altri servizi)? Va deciso esplicitamente da Mauro.
7. **Ha un colore o un comando nuovo?** Deve rispettare "un colore, un significato" e i componenti esistenti.
8. **Come si verifica?** Test per la logica, schermata per ciò che Mauro deve giudicare.

Poi: la decisione si prende in chat, il lavoro diventa un'issue `da-fare` con un responsabile, la regola entra in `docs/BRIEF.md` con una pull request che l'altra persona approva. Il ciclo completo è in `docs/METODO.md`, "Ciclo di un lavoro".

## 9. Idee future

Stanno nelle issue di GitHub con l'etichetta `idea`: non decise e non pianificate. Si riprendono da lì.

## 10. Fuori per scelta

Scartate, non rimandate. Si riaprono solo se Mauro lo chiede.

- Sfida mattutina e programmi di allenamento (le tabelle restano nel database, inutilizzate).
- Tema chiaro.
- Passi inseriti a mano; più uscite in bici a mano nello stesso giorno.
- Obiettivo del giorno o nutrienti modificabili giorno per giorno.
- Piani che scendono sotto il metabolismo basale; livello di attività nel profilo.
- "Copia da ieri".
- Foto del piatto; ricettario separato.
- Gestione inviti nell'app; app nativa; app a pagamento per leggere Salute.
- Collegamento diretto a Strava (API a pagamento); attività diverse da bici e passi.
- Email di avviso per i dati da Salute (basta l'avviso nell'app).
- Riconoscimento automatico dei preferiti senza etichetta (si usa l'etichetta: niente falsi riconoscimenti).
- Porzioni nella scheda del piatto (si usa il peso); tasto + nella vista Trend; schermata Grafici separata.
