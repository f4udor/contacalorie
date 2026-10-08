# Report fase 4: inserimento con l'AI, preferiti, pulizia

## 1. In parole semplici

**Cosa c'è ora.**
- **Stima dei pasti con l'AI.** Premi **+**: in cima c'è il campo **«Cosa hai mangiato?»**. Scrivi, o detta con il microfono della tastiera, una frase come «anelli di totano e un'insalata di pomodorini» e premi **Stima**. L'app propone i pasti con i loro piatti (qui: due piatti nella cena). Per ogni piatto vedi nome, quantità, kcal e nutrienti; se non hai detto la quantità, l'AI ne ipotizza una e lo scrive («ipotizzata»). Puoi cambiare ogni numero, cambiare la fascia, togliere un piatto, oppure scrivere una **correzione** («il totano era di più») e premere **Rifai la stima**. Non viene salvato nulla finché non premi **Conferma**; **Annulla** non salva niente.
- **Piatto a mano con stima.** Nel piatto a mano scrivi nome e quantità: se non conosci le kcal, **Stima con AI** riempie i numeri e tu li controlli.
- **Preferiti.** Tocca un piatto → **Salva nei preferiti**. Tocca l'intestazione di un pasto → **Salva pasto** (con un nome che puoi cambiare). In **+ → Preferiti** li cerchi per nome, scegli la fascia e un tocco li aggiunge al giorno, senza AI. Si eliminano con conferma.
- **Primo avvio guidato.** Chi apre l'app senza nessuna impostazione vede tre schermate brevi (peso, peso obiettivo, kcal base già a 2.100) con **Salta**, e poi arriva in Oggi. Le stesse voci si cambiano sempre in Impostazioni.
- **Impostazioni → Collegamenti.** Dice se la stima automatica è **attiva** o **non configurata**.
- **Sfida mattutina tolta.** Spariscono la sezione in Oggi, i giorni di sfida in Settimana e la data di inizio in Impostazioni. I dati vecchi della sfida nel database restano, inutilizzati.
- **Guida** per attivare l'AI: `docs/COLLEGA-VERTEX.md` (nove passi, circa 30 minuti).

**Come funziona l'AI, in breve.** Al modello (Gemini su Vertex AI, di Google) va **solo** il testo che scrivi, la data e l'ora (per capire se è colazione o cena) e, quando correggi, la stima precedente. Niente peso, obiettivi o email. La chiamata parte dal server dell'app, solo per chi ha fatto l'accesso, con **al massimo 60 stime al giorno**. La chiave di Google sta solo su Vercel, mai nel telefono.

**Cosa si può provare e come.** Senza collegare nulla, l'app funziona come prima: il campo AI dice «Stima automatica non disponibile» e tutto il resto (piatto a mano, preferiti, primo avvio) funziona già. Per attivare l'AI segui `docs/COLLEGA-VERTEX.md`. Gli screenshot di ogni schermata sono in `docs/screenshots/`.

**Cosa manca.** Dati da Salute e Fitness (fase 5), grafici (fase 6), promemoria (fase 7). **Soprattutto manca la prova con Vertex AI vero**: nessuno ha ancora collegato un progetto Google Cloud, quindi la qualità delle stime e il collegamento sono provati solo con risposte finte (vedi la parte tecnica).

### Controlli da fare sul telefono

**Prima di collegare Vertex AI** (l'app com'è ora, 5 minuti):
1. **Campo AI spento.** Premi **+**: in cima c'è «Cosa hai mangiato?» con il suggerimento sul microfono. Scrivi una frase: **Stima** resta disattivata e un avviso dice «Stima automatica non disponibile». La frase non sparisce.
2. **Collegamenti.** *Impostazioni*: in fondo, sotto il modulo, **Collegamenti → Stima automatica (AI): non configurata**.
3. **Piatto a mano.** **+ → Piatto a mano**: scrivi nome e **420** kcal e salva. Senza AI le kcal sono ancora obbligatorie (c'è l'asterisco).
4. **Preferiti.** Tocca il piatto appena salvato → **Salva nei preferiti** («Salvato nei preferiti.»). Tocca l'intestazione di un pasto → cambia il nome → **Salva pasto**. Poi **+ → Preferiti**: cerca per nome, scegli la fascia, tocca il preferito: compare nel giorno. **Elimina** → **Elimina davvero** lo toglie.
5. **Sfida sparita.** In *Oggi*, *Settimana* e *Impostazioni* non c'è più nulla della sfida mattutina.
6. **Primo avvio** (solo su un dispositivo senza impostazioni, per esempio un browser mai usato): tre schermate, **Salta** o **Fine**, poi *Oggi*. Con peso 92,5 e obiettivo 82 le proteine sono **150 g**.

**Dopo aver collegato Vertex AI** (seguendo la guida):
7. **Collegamenti** dice **attiva**.
8. **Stima di un pasto.** **+**: scrivi «anelli di totano e un'insalata di pomodorini», **Stima**: compaiono due piatti nella fascia giusta per l'ora, con quantità «ipotizzata». **Conferma**: i piatti sono in *Oggi*.
9. **Due pasti in una frase.** «A colazione un cappuccino e un cornetto e a pranzo un panino con prosciutto»: due pasti, colazione e pranzo.
10. **Correzione e microfono.** Dopo una stima scrivi (o detta con il microfono della tastiera) «il totano era di più» in **Correggi** → **Rifai la stima**: i numeri cambiano. Prova anche **Stima con AI** nel piatto a mano con nome «Spaghetti al pesto» e quantità «80 g di pasta», lasciando le kcal vuote.

**Attenzione alla chiave.** Il file `.json` di Google non va mai incollato in chat né caricato su GitHub: la guida spiega come metterlo solo su Vercel e poi cancellarlo.

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T4.0 Rimozione della sfida mattutina | fatto |
| T4.1 Provider AI e stima lato server | fatto |
| T4.2 Schermata di inserimento con l'AI | fatto |
| T4.3 Piatto a mano con stima | fatto |
| T4.4 Preferiti | fatto |
| T4.5 Primo avvio guidato | fatto (respinto una volta: il banner dei dati illeggibili copriva l'intestazione del primo avvio; ora il primo avvio compare dopo aver chiuso l'avviso. Il secondo rilievo, le kcal «2100» invece di «2.100», non è stato accolto: nei campi il punto è letto come virgola decimale e il revisore ha confermato) |
| T4.6 Guida al collegamento di Vertex AI | fatto |
| T4.7 Report di fase | questo file |

Nessun task `bloccato`, quindi nessun ultimo tentativo da fare. Revisioni fatte dal subagente `revisore`. Il commit di ogni task ha il suo codice; per T4.4 e T4.5 ci sono anche commit intermedi "in corso" (screenshot in rigenerazione) richiesti dal controllo di fine sessione.

### Come sono fatte le cose
- **Modulo AI** (`src/modules/ai`): interfaccia `AiProvider` (una sola operazione, stima pasti da testo), `VertexProvider` (Gemini via REST, token dell'account di servizio firmato con `node:crypto`, nessuna libreria nuova), provider finto, prompt in italiano (`prompt.ts`) con schema JSON fisso, validazione della risposta (numeri finiti e non negativi con tetto, fasce ammesse, almeno un piatto), `handleEstimate` (accesso, limite, modello, validazione).
- **Route** `POST /api/estimate` (solo server) e `GET /api/estimate` (dice se l'AI è attiva). Variabili solo lato server: `VERTEX_PROJECT`, `VERTEX_REGION`, `VERTEX_MODEL`, `VERTEX_CREDENTIALS_JSON`, `AI_DAILY_LIMIT` (predefinito 60), `AI_PROVIDER=fake` per sviluppo. Con Supabase serve un utente con accesso (token verificato con `auth.getUser`); senza Supabase solo il provider finto è ammesso.
- **Database** (solo aggiunte): `ai_usage` + funzione `use_ai_estimate` (limite giornaliero, giorno di Roma, atomica), `favorites.quantity`, tabella `favorite_meals` (piatti in un campo JSON), `settings.onboarding_done`. `supabase/setup.sql` rigenerato. Le tabelle della sfida restano, inutilizzate.
- **Sportello:** nuovi metodi per i preferiti (browser, Supabase, importazione, `exportAll`); `AuthService.getAccessToken`; tolti quelli della sfida; i dati del browser vecchi (con registro della sfida, senza preferiti) si leggono ancora.
- **Schermate:** `ai-estimate.tsx`, `favorites-view.tsx`, `onboarding.tsx`, `links-section.tsx`, `ai-client.ts` (richieste, errori in messaggi chiari), `proposal-form.ts`, `favorites.ts`, `onboarding.ts`.
- **Motore:** `src/engine` solo con tolte le parti della sfida (`challenge*.ts`, `challengeDone`, `challengeDaysDone`); `week.test.ts` toccato solo per quello. Nessuna regola di calcolo cambiata.

### Test
- **417 test in 38 file** (Vitest), tutti verdi; `lint` e `build` passano. In questa fase: 317 → 417 (tolti i test della sfida, aggiunti quelli di AI, preferiti, primo avvio, sportello).
- Coperti: 15 frasi tipiche con il provider finto in `tests/fixtures/ai/` (un piatto, più piatti, due pasti, fascia detta e dedotta, quantità dette e mancanti, correzione, 4 risposte non valide, limite superato, senza accesso, testo vuoto); `VertexProvider` con una `fetch` finta (firma del token verificata, cache del token, errori); configurazione dalle variabili; route (503/200/401/400); cosa arriva al modello (solo testo, data, ora); funzione del limite su PostgreSQL locale; preferiti nel contratto comune dello sportello e con Supabase finto; importazione dei preferiti; primo avvio; guide (coerenza con il codice).
- Screenshot: **107 scenari × chiaro e scuro a 390 px (214 immagini)** in `docs/screenshots/`, con risposte del server finte per l'AI; lo script non segnala scorrimento orizzontale né aree sotto 44 px.
- La percentuale di copertura non è misurata.

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali: il limite di 60 stime conta ogni richiesta valida che arriva al modello (anche se la risposta poi non è utilizzabile); con l'AI attiva le kcal del piatto a mano restano da avere (scritte o stimate) per salvare; i preferiti si aggiornano se hanno lo stesso nome e la stessa quantità; i preferiti non conservano il segno «libero» né la data; la fascia dei preferiti si sceglie nella loro schermata; segno `onboarding_done` per non riproporre il primo avvio; kcal base uguali al predefinito non vengono salvate; il primo avvio compare dopo l'avviso di dati illeggibili.

### Limiti e cose non verificate
- **Vertex AI non è mai stato chiamato**: richiesta, schema di risposta, nome del modello e scambio del token sono provati solo con una `fetch` finta; la qualità delle stime e il rispetto dello schema da parte del modello vero non sono verificati.
- **Supabase** resta non provato dal vero (come in fase 3): la verifica del token con `auth.getUser`, le regole di sicurezza con un utente vero e l'invio della chiave di accesso al server non sono verificati. Le migrazioni 0006–0008 sono provate solo su PostgreSQL locale con uno stand-in dell'accesso.
- `docs/COLLEGA-VERTEX.md` è scritta con nomi di pulsanti e menu di Google Cloud e Vercel che conosco, **senza averli visti**; nomi dei modelli, disponibilità per regione, ruolo `roles/aiplatform.user` come ruolo sufficiente, costi e incollare un JSON su più righe su Vercel non sono verificati.
- Microfono della tastiera, tastiera numerica e pannello con la tastiera aperta non sono provati su iPhone; nessuna prova con il tocco su iPhone di quanto aggiunto in questa fase.
- Gli screenshot a 375 e 430 px non sono stati rigenerati (l'ultima verifica a quelle larghezze è la fase 2).
- Il tocco sull'intestazione di un pasto per salvarlo non ha un segno visivo (nessuna decorazione, come da stile): lo spiega il messaggio dei Preferiti vuoti.
- Il primo avvio non è provato dal vero con Supabase (account nuovo + dati del browser: prima il primo avvio, poi la proposta di importazione).
- Le esportazioni CSV non includono i preferiti (non richiesti).
