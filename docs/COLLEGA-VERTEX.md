# Collegare Personal Health all'AI (Vertex AI, Gemini)

Questa guida serve ad attivare la **stima automatica dei pasti**: scrivi (o detti con il microfono della tastiera) «anelli di totano e un'insalata di pomodorini» e l'app propone i piatti con calorie e nutrienti, da controllare e confermare. Non serve saper programmare: sono nove passi, uno per volta. Tempo: circa 30 minuti.

> **Nota.** Google Cloud e Vercel cambiano ogni tanto l'aspetto dei loro siti e i nomi dei modelli. Se un pulsante o un menu ha un nome leggermente diverso da quello scritto qui, cerca il più simile. Le descrizioni di "cosa vedi" sono quelle tipiche. Questa guida non è stata provata passo per passo su un progetto Google Cloud vero.

> **Regola d'oro: la chiave non va mai in chat, in un'email, in un messaggio né nel repository.**
> Al passo 5 scarichi un file `.json`: chi lo ha può usare il tuo account Google Cloud **e farti pagare**. Non incollarlo in una conversazione (nemmeno con me o con altri assistenti), non caricarlo su GitHub, non metterlo in una cartella sincronizzata. Va solo nelle impostazioni di Vercel (passo 7) e poi si cancella dal computer (passo 9).

**Prima di cominciare servono:**
- un account **Google** (quello di Gmail va bene);
- una **carta di pagamento** per attivare la fatturazione di Google Cloud (Vertex AI non funziona senza; con l'uso di una persona sola i costi sono di pochi centesimi al mese, vedi "Quanto costa" in fondo);
- l'accesso al tuo progetto su **Vercel**, dove è pubblicata l'app.

**Cosa succede se non fai nulla.** L'app continua a funzionare come adesso: il campo «Cosa hai mangiato?» dice «Stima automatica non disponibile» e puoi inserire i piatti a mano, con i numeri. Il collegamento è facoltativo e si può togliere in qualsiasi momento (vedi in fondo).

**Cosa riceve l'AI.** Solo il testo che scrivi, la data e l'ora (per capire se è colazione o cena) e, quando correggi una stima, la stima precedente. Niente peso, obiettivi, email o altri tuoi dati. Le chiamate partono dal server dell'app, mai dal telefono, e solo se hai fatto l'accesso.

---

## Passo 1. Crea il progetto su Google Cloud e attiva la fatturazione

1. Vai su **console.cloud.google.com** e accedi con il tuo account Google. Se è la prima volta accetta le condizioni.
2. In alto, accanto al logo, premi il selettore dei progetti, poi **New project** (Nuovo progetto).
3. **Project name**: `personal-health`. Premi **Create** e, quando è pronto, selezionalo dal selettore in alto.
4. Nel menu a sinistra (le tre righe **☰**) apri **Billing** (Fatturazione) e premi **Link a billing account** (o **Create account**): segui la procedura e inserisci la carta. Collega l'account di fatturazione al progetto `personal-health`.

**Cosa vedi:** in alto il nome `personal-health` nel selettore, e in **Billing** il progetto elencato con un account di fatturazione collegato. Se Google offre un credito di prova, puoi usarlo.

**Annota** l'**ID del progetto** (non il nome): si legge nel selettore dei progetti o nella pagina **Dashboard**, per esempio `personal-health-123456`. Ti serve al passo 7.

---

## Passo 2. Attiva l'API di Vertex AI

1. Menu **☰ → APIs & Services → Library** (Libreria).
2. Nella barra di ricerca scrivi **Vertex AI API**, aprila e premi **Enable** (Abilita).

**Cosa vedi:** dopo qualche secondo la pagina dell'API con la scritta **API enabled** (o un pulsante **Manage**). Se avevi già abilitato altre API non cambia nulla.

---

## Passo 3. Scegli la regione europea e il modello

L'app chiama il modello in una **regione** che scegli tu: scegline una **europea**, così le richieste restano in Europa.

1. Menu **☰ → Vertex AI → Model Garden** (Giardino dei modelli). Cerca **Gemini** e apri un modello della famiglia **Flash** (veloce ed economico: va bene per stimare un piatto).
2. Nella pagina del modello trovi il suo **nome tecnico** (per esempio `gemini-2.5-flash`; il numero della versione cambia nel tempo) e l'elenco delle **regioni** in cui è disponibile (cerca la sezione *Locations* / *Regions*, oppure la pagina «Model versions and lifecycle» / «Locations» nella documentazione di Vertex AI).
3. Scegli **una regione europea in cui quel modello è disponibile**, per esempio `europe-west4` (Paesi Bassi) o `europe-west1` (Belgio).

**Annota** due cose: il **nome del modello** (`gemini-…`) e la **regione** (`europe-…`). Ti servono al passo 7. Se più avanti la prova (passo 8) dice che la stima non funziona, la causa più probabile è un modello non disponibile nella regione scelta o un nome scritto male: ricontrolla questo passo.

---

## Passo 4. Crea un account di servizio con il ruolo minimo

L'app non usa la tua password di Google: usa un "account di servizio", un utente-robot che può fare **solo** chiamare i modelli.

1. Menu **☰ → IAM & Admin → Service Accounts**.
2. Premi **Create service account**.
3. **Service account name**: `personal-health-ai`. Premi **Create and continue**.
4. In **Grant this service account access to project** scegli il ruolo **Vertex AI User** (cercalo scrivendo «Vertex AI User»; tecnicamente `roles/aiplatform.user`). **Un solo ruolo, nessun altro.** Non scegliere *Owner*, *Editor* o *Admin*.
5. Premi **Continue**, poi **Done** (non serve assegnare utenti all'account).

**Cosa vedi:** nell'elenco compare `personal-health-ai@…iam.gserviceaccount.com`.

---

## Passo 5. Scarica la chiave (file JSON)

1. Nell'elenco degli account di servizio premi sull'indirizzo `personal-health-ai@…`.
2. Apri la scheda **Keys** (Chiavi), premi **Add key → Create new key**, scegli **JSON** e premi **Create**.

**Cosa vedi:** il browser scarica un file con un nome tipo `personal-health-123456-a1b2c3d4.json`. Si apre con un editor di testo: contiene `"type": "service_account"`, `"client_email"` e `"private_key"`.

**Attenzione.** Quel file è la chiave. **Non incollarlo in chat, non mandarlo per email, non metterlo su GitHub.** Se pensi di averlo condiviso per sbaglio, torna in **Keys** e premi **Delete** accanto alla chiave (diventa subito inutilizzabile), poi creane una nuova.

Se Google rifiuta la creazione della chiave dicendo che la *policy dell'organizzazione* lo vieta, vuol dire che il progetto è dentro un'organizzazione aziendale con regole più strette: usa un progetto personale (passo 1) fuori da quell'organizzazione.

---

## Passo 6. Imposta un avviso di budget

Un avviso ti manda un'email se la spesa cresce più del previsto. (Attenzione: **avvisa soltanto, non blocca la spesa.** In più l'app non fa più di **60 stime al giorno** per utente.)

1. Menu **☰ → Billing → Budgets & alerts**.
2. Premi **Create budget**. **Name**: `personal-health`. Lascia selezionato il progetto `personal-health` (o tutti i progetti dell'account di fatturazione).
3. **Amount**: *Specified amount*, per esempio **5 €** al mese.
4. Lascia le soglie proposte (50 %, 90 %, 100 %) con l'invio di email attivo e premi **Finish**.

**Cosa vedi:** il budget nell'elenco, con la spesa del mese a zero.

---

## Passo 7. Inserisci i valori su Vercel (solo lato server)

1. Vai su **vercel.com**, entra e apri il progetto dell'app.
2. In alto premi **Settings**, poi nel menu a sinistra **Environment Variables**.
3. Aggiungi queste **quattro** variabili, una per volta (**Key** = nome, **Value** = valore), con **Production** selezionato (e, se vuoi, **Preview**), poi **Save**:

| Key (nome) | Value (valore) |
|---|---|
| `VERTEX_PROJECT` | l'**ID del progetto** del passo 1 (per esempio `personal-health-123456`) |
| `VERTEX_REGION` | la regione del passo 3 (per esempio `europe-west4`) |
| `VERTEX_MODEL` | il nome del modello del passo 3 (per esempio `gemini-2.5-flash`) |
| `VERTEX_CREDENTIALS_JSON` | **tutto il contenuto** del file JSON del passo 5: aprilo con un editor di testo, seleziona tutto, copia e incolla nel campo *Value* |

4. Per `VERTEX_CREDENTIALS_JSON` attiva, se c'è, l'opzione **Sensitive** (il valore non sarà più leggibile dopo il salvataggio).
5. Facoltativo: `AI_DAILY_LIMIT` = un numero (per esempio `30`) per abbassare il limite di stime al giorno. Se non la metti vale **60**.

I nomi vanno scritti **esattamente** così, maiuscole e trattini bassi compresi. **Non** aggiungere `NEXT_PUBLIC_` davanti: i nomi con quel prefisso finiscono nel telefono di chi apre l'app, e la chiave non deve mai arrivarci.

**Cosa vedi:** un elenco con le variabili; i valori sono nascosti con dei puntini.

---

## Passo 8. Ripubblica l'app e prova una stima

Le variabili contano solo dalla prossima pubblicazione: se salti questo passo non cambia nulla.

1. Su Vercel premi **Deployments**; sulla riga più recente premi i tre puntini **⋯** e scegli **Redeploy**, poi conferma con **Redeploy**. Aspetta che lo stato diventi **Ready** (di solito un minuto).
2. Apri l'app (accedi se serve). Vai in **Impostazioni** e apri **Collegamenti**: la voce *Stima automatica (AI)* deve dire **attiva**. Se dice *non configurata*, vedi "Se qualcosa non va".
3. Torna in **Oggi**, premi **+**. In cima scrivi, per esempio, *anelli di totano e un'insalata di pomodorini* e premi **Stima**.
4. Compare la proposta: due piatti nel pasto della fascia giusta, con le quantità segnate **ipotizzata**. Controlla i numeri, correggi se serve (o scrivi una correzione in **Correggi** e premi **Rifai la stima**), poi premi **Conferma**.

**Cosa vedi:** i piatti nella schermata **Oggi**, con i loro totali. La prima stima può richiedere qualche secondo.

---

## Passo 9. Cancella il file della chiave dal computer

Ora la chiave sta su Vercel e il file non serve più: **cancellalo** dalla cartella Download e svuota il cestino. Se un giorno serve di nuovo, si crea una chiave nuova (passo 5) e si sostituisce il valore su Vercel (poi si ripubblica).

---

## Se qualcosa non va

| Cosa succede | Cosa fare |
|---|---|
| In Impostazioni → Collegamenti c'è scritto **non configurata** | Mancano delle variabili del passo 7, hanno il nome sbagliato, oppure `VERTEX_CREDENTIALS_JSON` non contiene un JSON intero (deve iniziare con `{` e finire con `}`). Controlla e **ripubblica** (passo 8). |
| «Stima automatica non disponibile» | Come sopra: la stima si accende solo con tutte e quattro le variabili. |
| «Non riesco a raggiungere il servizio di stima» | Se la connessione c'è, di solito è un errore di Google: modello non disponibile nella regione (ricontrolla il passo 3), API non abilitata (passo 2), fatturazione non collegata (passo 1) o ruolo mancante (passo 4: *Vertex AI User*). Su Vercel, in **Logs**, il messaggio di Google dice quale. |
| «La stima ricevuta non è utilizzabile» | Il modello ha risposto in modo strano: riprova, magari con parole diverse. Non viene salvato nulla. |
| «Hai raggiunto il limite di stime di oggi» | Hai fatto tutte le stime del giorno (60, o il numero di `AI_DAILY_LIMIT`). Riprova domani oppure inserisci i piatti a mano. |
| «Non hai effettuato l'accesso» | Con Supabase attivo la stima è riservata a chi ha fatto l'accesso: ricarica la pagina e accedi. |

## Come tornare indietro

Su Vercel cancella le quattro variabili del passo 7 e ripubblica (passo 8). La stima si spegne e l'app torna all'inserimento a mano. Per chiudere del tutto l'accesso di Google: **IAM & Admin → Service Accounts → Keys → Delete** (oppure cancella l'account di servizio).

## Quanto costa

Ogni stima è una richiesta breve a un modello di tipo *Flash*: di solito una frazione di centesimo. Con l'uso di una persona sola il costo mensile dovrebbe restare di pochi centesimi, ma **i prezzi di Google cambiano**: guarda la pagina *Vertex AI pricing* per il modello che hai scelto e controlla il budget del passo 6 ogni tanto. Il limite di stime al giorno protegge da usi anomali.
