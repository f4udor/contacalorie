# Report fase 3: dati online con Supabase, pasti composti da piatti

## 1. In parole semplici

**Cosa c'è ora.**
- **Pasti fatti di piatti.** In Oggi ogni pasto (colazione, pranzo, cena, spuntino) è una scheda con il totale di kcal e macro e i piatti elencati sotto, ognuno con nome, quantità facoltativa (es. "100 g") e kcal. Ogni pasto ha il suo "+ Aggiungi piatto"; il **+** in basso chiede la fascia. Il "pasto libero" si segna sul pasto intero e il tetto di 800 kcal vale per la somma dei piatti. "Copia da ieri" copia tutti i piatti come pasto normale.
- **Proteine sul peso obiettivo.** Se in Impostazioni c'è il peso obiettivo, le proteine sono 1,8 g per kg di quel peso (esempio: obiettivo 85 kg → 155 g). Senza peso obiettivo restano 1,4 g per kg del peso attuale. Impostazioni spiega su quale peso sono calcolate.
- **Collegamento a Supabase (pronto, ma spento).** L'app sa salvare i dati online e farti entrare con **email + codice di 6 cifre** (niente password, niente link). Resta **spento** finché non inserisci le due variabili su Vercel: senza, l'app funziona esattamente come prima, con i dati nel browser.
- **Importazione** dei dati già inseriti sul dispositivo, senza doppioni, anche da più dispositivi; i dati restano sul dispositivo finché non confermi tu.
- **Esportazione** in file CSV (piatti, pesate e attività) da Impostazioni → Dati: funziona con o senza Supabase.
- **Guida** passo per passo: `docs/COLLEGA-SUPABASE.md`.
- **Errori di rete:** un avviso giallo in cima dice cosa non è andato; quello che avevi scritto resta sullo schermo e puoi riprovare.

**Cosa si può provare e come.** Prima di collegare Supabase l'app è quella di prima con i piatti e le proteine nuove. Per il collegamento segui `docs/COLLEGA-SUPABASE.md`: sono dieci passi, circa 20 minuti. Gli screenshot di ogni schermata sono in `docs/screenshots/`.

**Cosa manca.** Dati da Salute e Fitness (fase 4), inserimento a voce e AI con stima dei numeri mancanti e preferiti (fase 5), grafici (fase 6), promemoria (fase 7). **Soprattutto manca la prova con Supabase vero**: nessuno ha ancora collegato un progetto reale, quindi tutto ciò che riguarda il collegamento è provato solo con un database finto (vedi la parte tecnica).

### Controlli da fare sul telefono

**Prima di collegare Supabase** (l'app com'è ora, 5 minuti):
1. **Pasto con più piatti.** Tocca **+** → *Piatto a mano*, scegli *Pranzo*, scrivi "Riso" con quantità "100 g" e **350** kcal. Poi nella scheda *Pranzo* tocca **+ Aggiungi piatto** (la fascia non te la chiede) e aggiungi "Pollo" **330** kcal. La scheda mostra **680 kcal** in cima e i due piatti sotto.
2. **Pasto libero con più piatti.** Aggiungi alla *Cena* tre piatti da 500, 400 e 300 kcal e attiva *Pasto libero* in uno: le kcal mangiate sono 1.200 ma l'anello conta **800**; compare "nel budget 800 kcal".
3. **Un solo pasto libero a settimana.** Prova ad aggiungere un secondo pasto libero nella stessa settimana: l'interruttore è spento e spiega perché.
4. **Aggiungi un piatto a un pasto libero** dal **+** scegliendo la stessa fascia: l'interruttore si accende da solo e il pasto resta libero.
5. **Proteine.** In *Impostazioni* scrivi un peso attuale **100** e un peso obiettivo **85**: sotto *Proteine* leggi "Calcolato su 1,8 g per kg del peso obiettivo (85 kg)" e la proposta è **155 g**. Togli il peso obiettivo: torna **140 g**.
6. **Esporta.** *Impostazioni → Dati → Esporta i piatti (CSV)*: il file si scarica (su iPhone va nell'app *File*) e si apre con Excel o Numbers con i numeri in colonne.

**Dopo aver collegato Supabase** (seguendo la guida, 10 minuti):
7. **Accesso.** Aprendo l'app compare *Accedi*: scrivi la tua email, arriva un **codice di 6 cifre** (guarda anche lo spam), lo scrivi e vedi *Oggi*. Chiudi e riapri l'app: non te lo richiede.
8. **Importazione.** Se sul dispositivo c'erano dati, compare *Importa i dati di questo dispositivo* con giorni, piatti e pesate. Premi *Importa*, controlla *Oggi* e *Settimana*, poi *Tutto a posto: togli i dati da questo dispositivo*. Se ripeti l'importazione non compaiono doppioni.
9. **Due dispositivi.** Inserisci un piatto sull'iPhone e ricarica l'app sul Mac: c'è. Cambia un valore in *Impostazioni* da una parte e controlla dall'altra.
10. **Rete assente.** Metti il telefono in modalità aereo e prova a salvare una pesata: compare l'avviso giallo e il valore resta scritto; togli la modalità aereo e premi di nuovo *Salva pesata*: funziona. Poi *Impostazioni → Account → Esci* riporta alla schermata *Accedi*.

**Attenzione all'iPhone.** L'app aperta in Safari e l'app installata sulla Home hanno memorie separate: fai l'importazione dalla versione in cui hai inserito i dati.

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T3.0 Motore: pasto libero sul pasto intero | fatto (respinto una volta: il diario non nominava i test aggiornati) |
| T3.1 Motore: proteine sul peso obiettivo | fatto |
| T3.2 Schermate: pasti composti da piatti | fatto (respinto una volta: grammatica del testo dell'interruttore; un piatto aggiunto dal + a un pasto libero toglieva il segno) |
| T3.3 Sportello dati su Supabase | fatto |
| T3.4 Accesso con email e codice | fatto (respinto una volta: ritocco non giustificato nel diario) |
| T3.5 Importazione | fatto |
| T3.6 Esportazione | fatto |
| T3.7 Guida al collegamento | fatto |
| T3.8 Report di fase | questo file |

Nessun task bloccato, quindi nessun ultimo tentativo da fare. Revisioni fatte dal subagente `revisore`. In più, due correzioni a Impostazioni (fase 2) scoperte lungo la strada, in commit separati: il suggerimento delle proteine ripeteva "serve il peso" e la proposta dei grassi chiedeva il peso senza averne bisogno.

### Come sono fatte le cose
- **Motore** (`src/engine`): `groupMeals`/`MealGroup` (un pasto = piatti di una fascia in un giorno), tetto del pasto libero sulla somma, `hasFreeMealInWeek` per giorno e fascia, `proteinPerKgTarget` (1,8) e `nutrientTargets` con il peso obiettivo. Test del motore toccati: solo quelli sul pasto libero (`budget.test.ts`, `week.test.ts`) e la tabella dei default (`settings.test.ts`); elencati nel diario.
- **Database:** nessuna colonna rinominata o eliminata. Il segno "libero" sta su tutti i piatti del pasto. Nuova migrazione `…0005_piatti_e_proteine.sql` (`meals.quantity`, `settings.protein_per_kg_target`); `supabase/setup.sql` è l'unione generata (`npm run setup-sql`), con un test che ne controlla l'aggiornamento.
- **Sportello:** `DataStore` ha tre implementazioni (memoria, browser, Supabase) con la stessa batteria di test; la scelta è fatta da `createDataStore` (Supabase solo con entrambe le variabili). `exportAll` serve a importazione ed esportazione. Ogni errore diventa un avviso (`withErrorReporting`).
- **Accesso:** `AuthService` (Supabase `signInWithOtp`/`verifyOtp`) e una modalità dimostrativa, attiva solo senza Supabase e con una chiave nel browser, usata solo per gli screenshot.
- Dipendenza aggiunta: `@supabase/supabase-js` (motivo nel diario), caricata solo se Supabase è configurato.

### Test
- **317 test in 30 file** (Vitest), tutti verdi; `lint` e `build` passano. In questa fase: 215 → 317.
- Coperti: casi K e L del brief; raggruppamento dei piatti; salvataggio dei piatti con segno libero; sportello Supabase contro un database finto (contratto comune con memoria e browser, errori di rete e di server, utente non collegato, oltre 1.000 righe a pagine); accesso con client finto; importazione (account vuoto, ripetizione, secondo dispositivo, errore a metà, pasti vecchi); CSV; guida (coerenza con il codice).
- Screenshot: 80 scenari × chiaro e scuro a 390 px (160 immagini) in `docs/screenshots/`; lo script non segnala scorrimento orizzontale né aree sotto 44 px. **Gli screenshot a 375 e 430 px non sono stati rigenerati in questa fase** (l'ultima verifica è quella della fase 2).
- La percentuale di copertura non è misurata.

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali: segno "libero" su tutti i piatti del pasto (un pasto è libero se almeno un piatto lo è); in importazione, un pasto vecchio con un piatto libero e uno normale diventa libero per intero; unione dei dati importati (vince quello già nell'account, si completano i mancanti, niente viene cancellato); creazione automatica dell'account al primo accesso (da spegnere dopo, come dice la guida); formato CSV per Excel in italiano (`;`, virgola, BOM); quantità del piatto come testo libero.

### Limiti e cose non verificate
- **Nulla è stato provato contro Supabase vero**: lo sportello è provato con un database finto in memoria; `setup.sql` è stato applicato solo a un PostgreSQL locale con uno stand-in dell'accesso; invio dell'email con il codice, sessione sull'app installata sulla Home e compilazione automatica del codice non sono verificati.
- La guida `COLLEGA-SUPABASE.md` è scritta con i nomi di pulsanti e menu di Supabase e Vercel che conosco, **senza averli visti**: possono essere cambiati.
- Il caso di un salvataggio fallito con Supabase (avviso e pannello che resta aperto per riprovare) è coperto da test ma non da uno screenshot; lo screenshot mostra il caso del browser che non riesce a scrivere.
- "Copia da ieri" interrotta a metà da un errore di rete e ripetuta può duplicare i piatti già copiati.
- Il file CSV è stato scaricato e letto in un browser headless, non aperto con Excel né provato su iPhone; nessuna prova con il tocco su iPhone di quanto aggiunto in questa fase.
- Il formato del campo data (gg/mm/aaaa) negli screenshot appare mm/gg/aaaa per la lingua del browser di prova.
