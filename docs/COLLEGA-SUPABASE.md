# Collegare Personal Health a Supabase

Questa guida serve a far salvare i tuoi dati **online**, così li vedi uguali su iPhone e Mac. Non serve saper programmare: sono dieci passi, uno per volta. Tempo: circa 20 minuti.

> **Nota.** Supabase e Vercel cambiano ogni tanto l'aspetto dei loro siti. Se un pulsante ha un nome leggermente diverso da quello scritto qui, cerca il più simile. Le descrizioni di "cosa vedi" sono quelle tipiche.

**Prima di cominciare servono:**
- un indirizzo email a cui hai accesso (userai sempre quello per entrare nell'app);
- l'accesso al tuo progetto su **Vercel**, dove è pubblicata l'app;
- il file `supabase/setup.sql` di questo repository (al passo 2 ti dico come copiarlo).

**Cosa succede se non fai nulla.** L'app continua a funzionare come adesso, con i dati salvati nel browser di ogni dispositivo. Il collegamento è facoltativo e si può togliere in qualsiasi momento (vedi in fondo).

---

## Passo 1. Crea il progetto su Supabase

1. Vai su **supabase.com** e premi **Start your project** (o **Sign in** se hai già un account). Puoi entrare con GitHub o con l'email.
2. Nella pagina dei progetti premi **New project**. Se ti chiede di creare una "organization", accetta il nome proposto.
3. Compila:
   - **Name**: `personal-health`;
   - **Database password**: premi **Generate a password** e **salvala** in un posto sicuro (ad esempio nel tuo gestore di password). Non la userai nell'app, ma serve per recuperare il database;
   - **Region**: scegli un'area europea (per esempio *Central EU (Frankfurt)*);
   - **Plan**: *Free* (gratuito).
4. Premi **Create new project**.

**Cosa vedi:** una pagina con un'animazione e la scritta tipo *"Setting up your project"*. Dopo uno o due minuti si apre la pagina principale del progetto, con un menu a sinistra (*Table Editor*, *SQL Editor*, *Authentication*…). Aspetta che sia finita prima di andare avanti.

---

## Passo 2. Crea le tabelle (incolla `setup.sql`)

1. Apri il file **`supabase/setup.sql`** del repository su GitHub. In alto a destra premi **Raw** (si apre solo il testo). Seleziona tutto (**⌘A** su Mac, **Ctrl+A** su Windows) e copia (**⌘C** / **Ctrl+C**).
2. Su Supabase, nel menu a sinistra premi **SQL Editor**, poi **New query**.
3. Incolla il testo (**⌘V** / **Ctrl+V**) nell'area bianca.
4. Premi **Run** (in basso a destra, o **⌘+Invio**).

**Cosa vedi:** in basso, sotto il testo, compare una riga verde con la scritta **"Success. No rows returned"**. Se invece compare un riquadro **rosso** con un errore, non ripetere a caso: vedi "Se qualcosa non va" in fondo.

Il file va eseguito **una volta sola**.

**Controllo (facoltativo):** nel menu a sinistra premi **Table Editor**. Devi vedere dieci tabelle, tra cui `meals`, `weigh_ins`, `daily_activity`, `settings`, `challenge_plans`.

---

## Passo 3. Attiva l'accesso con codice via email

L'app fa entrare con un **codice di 6 cifre** ricevuto per email (niente password, niente link).

1. Nel menu a sinistra premi **Authentication**.
2. Apri **Sign In / Providers** (in alcune versioni: **Providers**) e controlla che **Email** sia **attivo** (interruttore verde).
3. Dentro **Email**, controlla che la lunghezza del codice (**Email OTP Length**) sia **6**. Se c'è l'interruttore **Confirm email**, lascialo com'è.
4. Salva con **Save** se compare il pulsante.

**Cosa vedi:** la riga *Email* con la scritta *Enabled*.

---

## Passo 4. Cambia il modello dell'email, così arriva il codice

Per impostazione predefinita Supabase manda un **link**. A noi serve il **codice**. Bisogna cambiare due modelli di email.

1. Sempre in **Authentication**, premi **Emails** (o **Email Templates**).
2. Apri il modello **Magic Link**. Cancella il testo del corpo e incolla questo:

   ```html
   <h2>Il tuo codice di accesso</h2>
   <p>Scrivi questo codice nell'app Personal Health per entrare:</p>
   <p style="font-size: 28px; letter-spacing: 6px;"><strong>{{ .Token }}</strong></p>
   <p>Vale per poco tempo. Se non l'hai chiesto tu, ignora questa email.</p>
   ```

   Nel campo **Subject** (oggetto) scrivi: `Il tuo codice di accesso a Personal Health`.
3. Premi **Save changes**.
4. Apri anche il modello **Confirm signup** e fai **lo stesso identico cambio** (stesso corpo, stesso oggetto), poi **Save changes**. Serve la prima volta che entri, quando l'account viene creato.

**Importante:** devi lasciare la scritta `{{ .Token }}` esattamente così, con le doppie graffe: è lì che Supabase mette il codice.

**Cosa vedi:** accanto al testo c'è un'anteprima dell'email, con al posto di `{{ .Token }}` un numero di esempio.

---

## Passo 5. Copia l'indirizzo e la chiave pubblica

1. Nel menu a sinistra premi l'ingranaggio **Project Settings**, poi **API** (in alcune versioni: **API Keys** / **Data API**).
2. Copia due valori e **incollali per ora in un appunto**:
   - **Project URL**: assomiglia a `https://abcdefgh.supabase.co`;
   - la chiave **anon public** (in alcune versioni si chiama **Publishable key** e inizia con `sb_publishable_…`). È una stringa lunghissima.

**Attenzione:** copia **solo** la chiave *anon / publishable*. **Non copiare mai** la chiave *service_role* (o *secret*): quella dà il controllo completo del database e non deve stare nell'app né essere condivisa con nessuno. La chiave pubblica invece può stare nell'app: i tuoi dati sono protetti dalle regole di sicurezza del database, che hai installato al passo 2 e che fanno leggere a ciascun utente solo le proprie righe.

---

## Passo 6. Inserisci i due valori su Vercel

1. Vai su **vercel.com**, entra e apri il progetto dell'app.
2. In alto premi **Settings**, poi nel menu a sinistra **Environment Variables**.
3. Aggiungi la **prima** variabile:
   - **Key** (nome): `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** (valore): il *Project URL* del passo 5
   - ambienti: lascia selezionati **Production** (e, se vuoi, **Preview**)
   - premi **Save**.
4. Aggiungi la **seconda** variabile:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: la chiave *anon / publishable* del passo 5
   - **Save**.

I due nomi vanno scritti **esattamente** così, maiuscole e trattini bassi compresi.

**Cosa vedi:** un elenco con le due variabili; il valore è nascosto con dei puntini.

---

## Passo 7. Ripubblica l'app

Le variabili contano solo dalla prossima pubblicazione: se salti questo passo non cambia nulla.

1. In alto su Vercel premi **Deployments**.
2. Sulla riga più recente premi i tre puntini **⋯** a destra e scegli **Redeploy**, poi conferma con **Redeploy**.
3. Aspetta che lo stato diventi **Ready** (di solito un minuto).

**Cosa vedi:** lo stato passa da *Building* a **Ready**, con un pallino verde.

---

## Passo 8. Accedi

1. Apri l'app dall'indirizzo di sempre.
2. Compare la schermata **Accedi** con un campo *Email*. Scrivi il tuo indirizzo e premi **Invia il codice**.
3. Apri la tua posta: arriva un'email con **il codice di 6 cifre** (se non c'è, guarda nello **spam**; con il servizio gratuito può arrivare dopo qualche minuto).
4. Torna nell'app, scrivi il codice e premi **Accedi**.

**Cosa vedi:** la schermata **Oggi**, vuota. Da questo momento i dati si salvano online. In **Impostazioni**, in fondo, vedi il tuo indirizzo email e il pulsante **Esci**.

**Si accede una volta sola per dispositivo:** la sessione resta attiva. Su ogni nuovo dispositivo ripeti questo passo con lo stesso indirizzo email.

---

## Passo 9. Importa i dati che hai già inserito

Finora i dati stavano nel browser di ogni dispositivo. Non vanno persi: l'app li porta nell'account.

1. Subito dopo l'accesso, se su quel dispositivo ci sono dati, compare un pannello **"Importa i dati di questo dispositivo"** con quanti giorni, piatti e pesate contiene. Premi **Importa**.
2. Compare **"Importazione completata"** con quello che è stato aggiunto. Guarda *Oggi* e *Settimana*: devi ritrovare i tuoi pasti.
3. Quando sei sicuro che sia tutto a posto, premi **Tutto a posto: rimuovi i dati da questo dispositivo** e conferma. Se hai dubbi premi **Tienili per ora**: i dati restano sul dispositivo e la voce rimane in **Impostazioni → Esporta i dati**.

Se hai usato l'app **su più dispositivi**, ripeti l'importazione su ognuno: i dati si **uniscono** e non si duplicano, nemmeno se ripeti.

**Attenzione all'iPhone.** L'app aperta in **Safari** e l'app installata sulla **Home** hanno memorie separate: i dati inseriti in una non si vedono nell'altra. Fai l'importazione **dalla stessa versione in cui hai inserito i dati** (di solito Safari), prima di installare l'app sulla Home o accedendo anche da lì.

---

## Passo 10. Controlla che funzioni su due dispositivi

1. Su iPhone inserisci un pasto.
2. Sul Mac apri l'app (già con l'accesso fatto): dopo aver ricaricato la pagina, il pasto c'è.

Se è così, hai finito.

**Facoltativo, ma consigliato.** Per evitare che altri creino account sulla tua app: su Supabase, **Authentication → Sign In / Providers**, spegni **Allow new users to sign up**. Funziona solo dopo il tuo primo accesso (il tuo account esiste già). Se un giorno devi accedere da un indirizzo email nuovo, riaccendilo.

---

## Se qualcosa non va

| Cosa succede | Cosa fare |
|---|---|
| Al passo 2 compare un errore rosso | Controlla di aver copiato **tutto** il file, dalla prima all'ultima riga, e di averlo eseguito **una sola volta**. Se l'errore dice che una tabella *esiste già*, il file è stato già eseguito: puoi andare avanti. |
| Non arriva l'email con il codice | Aspetta qualche minuto e controlla lo **spam**. Poi in app premi **Invia un nuovo codice**. Il servizio gratuito limita le email: se ne chiedi troppe l'app dice di aspettare un minuto. |
| L'email contiene un link e non un codice | Il modello del passo 4 non è stato salvato, oppure hai cambiato solo uno dei due modelli. Rifai il passo 4 per **Magic Link** e **Confirm signup**. |
| "Il codice non è corretto o è scaduto" | Scrivi il codice dell'**ultima** email ricevuta; i codici vecchi non valgono più. Si può copiare con o senza spazi. |
| L'app non mostra la schermata Accedi | Le variabili del passo 6 mancano, hanno il nome sbagliato oppure non hai fatto il passo 7 (ripubblicare). |
| "Non hai effettuato l'accesso" | La sessione è scaduta: ricarica la pagina e accedi di nuovo. |
| "Non è stato possibile salvare" | Manca la connessione: riprova tra poco. Quello che avevi scritto resta sullo schermo. |

## Come tornare indietro

Su Vercel cancella le due variabili del passo 6 e ripubblica (passo 7). L'app torna a usare i dati salvati nel browser. I dati già caricati restano online su Supabase, non si perdono.

## Dove stanno i dati e come averne una copia

I dati sono nel tuo progetto Supabase, protetti dalle regole di sicurezza: ognuno vede solo le proprie righe. Puoi scaricarne una copia quando vuoi da **Impostazioni → Esporta i dati** (file CSV che si aprono con Excel).
