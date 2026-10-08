# Report fase 5: dati da Salute, nuova regola del recupero, schede della Settimana

## 1. In parole semplici

**Cosa c'è ora.**
- **Passi e km in bici arrivano da soli dall'iPhone.** Un Comando rapido legge Salute e manda i dati all'app più volte al giorno. L'app tiene solo oggi e ieri; un valore che hai scritto a mano non viene mai sovrascritto; ripetere l'invio non crea doppioni.
- **Impostazioni → Collegamenti → Salute.** Crei il **codice personale** (si vede una sola volta, con **Copia** e l'indirizzo da incollare nel Comando rapido), puoi **Rigenerarlo** (con conferma) o **Disattivarlo**. Sotto vedi l'ultimo invio riuscito, i passi e i km ricevuti per oggi e ieri e, se l'ultimo tentativo è fallito, il motivo.
- **Avviso in Oggi.** Se c'è un codice attivo e da più di 24 ore non arriva nulla, in cima a Oggi compare «Nessun dato da Salute da ieri» e un tocco porta a Collegamenti. Senza codice nessun avviso.
- **Guida passo per passo** per costruire il Comando rapido: `docs/COLLEGA-SALUTE.md`.
- **Nuova regola del recupero.** Uno sgarro si recupera con correzioni piccole: al massimo 100 kcal al giorno (e nulla se il debito è sotto 25 kcal), mai con tagli forti. Il margine risparmiato in settimana fa da cuscinetto ma non supera 300 kcal, e il lunedì tutto riparte da zero. Per i giorni futuri Oggi e Settimana mostrano un'anteprima che non ripete lo stesso debito più volte (un debito di 250 kcal appare come −100, −100, −50). In Impostazioni → Obiettivi ci sono «Recupero massimo al giorno» e «Margine massimo della settimana».
- **Settimana: le schede si toccano.** **Peso** (c'è sempre: «Nessuna pesata» se manca), **Bici**, **Passi medi** e **Pasto libero** aprono un pannello: pesate da aggiungere o eliminare; i sette giorni di bici e passi con la fonte («da Salute» o «manuale»; si eliminano solo i valori a mano); il pasto libero da togliere (il pasto resta e conta per intero) o da scegliere tra i pasti della settimana. Dopo ogni modifica Settimana e Oggi mostrano subito i numeri ricalcolati.
- **Scorrimento a sinistra.** Su un piatto in Oggi compaiono **Preferiti** e il cestino (il cestino elimina subito, senza conferma); nei pannelli della Settimana compare il cestino. Il tocco sulla riga fa quello di prima. «Elimina davvero» ora si legge bene anche in tema chiaro.

**Cosa manca.** Grafici (fase 6), promemoria (fase 7). Salute, Supabase e Vertex AI restano da provare dal vero (vedi parte tecnica).

### Cosa provare sul telefono dopo la pubblicazione (10 minuti)
Prima di tutto va **eseguito il file `supabase/aggiornamento-fase-5.sql`** nell'editor SQL di Supabase (una volta sola) e l'app va ripubblicata su Vercel. Non serve nessuna nuova variabile.
1. **Oggi.** Apri un giorno passato e uno futuro: sotto l'anello, la riga «Base … · recupero −100» compare solo se c'è davvero un recupero.
2. **Impostazioni → Obiettivi.** Ci sono «Recupero massimo al giorno» (100) e «Margine massimo della settimana» (300) con una riga di spiegazione ciascuno; cambiane uno e controlla che l'obiettivo di Oggi cambi.
3. **Settimana.** Le sei schede: Bici, Passi medi, Peso e Pasto libero hanno una freccia a destra e si toccano. Senza pesate la scheda Peso dice «Nessuna pesata».
4. **Pesate.** Tocca Peso → «Aggiungi pesata» (scegli il giorno) → salva; poi elimina quella pesata con il cestino: la scheda torna a «Nessuna pesata».
5. **Bici e passi.** Aggiungi un'attività a mano da Oggi (+ → Attività a mano), poi in Settimana tocca Bici: la riga è «manuale» ed è eliminabile; svuota il giorno e guarda che il totale cambi.
6. **Pasto libero.** In Settimana tocca Pasto libero: se non c'è, scegli un pasto con «Segna come libero»; poi riaprilo e premi «Togli pasto libero»: il pasto resta, ma conta per intero (Oggi lo mostra).
7. **Scorrimento.** In Oggi scorri un piatto verso sinistra con il dito: compaiono Preferiti e cestino. Prova anche a scorrere la pagina in su e in giù (non deve bloccarsi), a scorrere verso destra (non succede nulla) e a toccare altrove (la riga si richiude). Il cestino elimina subito.
8. **Impostazioni → Collegamenti → Salute.** Premi «Crea codice»: il codice compare una volta con «Copia»; dopo «Fatto» non si vede più. «Rigenera codice» chiede conferma.

### Cosa provare dopo aver collegato il Comando rapido
Segui `docs/COLLEGA-SALUTE.md` (circa 30 minuti), poi:
1. Prova il comando a mano a telefono sbloccato e leggi la risposta: `ok`, righe salvate, righe lasciate perché inserite a mano, righe scartate con il motivo.
2. In **Oggi → Attività** passi e bici compaiono con la fonte «da Salute»; in **Impostazioni → Collegamenti → Salute** si vedono ultimo invio e valori ricevuti.
3. Scrivi a mano un valore per oggi e rilancia il comando: il valore a mano resta.
4. Rilancia il comando due volte di fila: nessun doppione.
5. Dopo un giorno con le automazioni attive (sei orari, senza notifica), controlla che i dati arrivino anche da soli. Se il telefono è bloccato quell'invio non riesce: è normale.
6. Per vedere l'avviso: disattiva le automazioni per più di 24 ore e apri Oggi.
7. Se usi anche un'altra app che scrive la stessa uscita in Salute, i km risultano doppi: tieni una sola app (vedi la guida).

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T5.0 Ingresso dei dati da Salute | fatto |
| T5.1 Codice personale, stato e avviso | fatto |
| T5.2 Guida al Comando rapido | fatto (respinto una volta: la guida rimandava a una funzione di Settimana non ancora presente; corretto) |
| T5.3 Nuova regola del recupero | fatto |
| T5.4 Schede della Settimana toccabili | fatto (respinto una volta: mancavano il test della scheda Peso e le prove del ricalcolo; corretto) |
| T5.5 Scorrimento a sinistra per le azioni | fatto |
| T5.6 Report di fase | questo file |

Nessun task `bloccato`: nessun ultimo tentativo da fare a fine fase. I commit «in attesa di revisione» sono richiesti dal controllo di fine sessione.

### Come sono fatte le cose
- **Ingresso** (`src/modules/activity`): `parse.ts` (lettura tollerante di date, passi e km), `ingest.ts` (`handleHealthIngest`: codice, filtro oggi/ieri a Roma, risposta leggibile, limite di 200 chiamate al giorno), `fake-gate.ts` (ingresso finto con le stesse regole, per i test). Route `POST /api/ingest/health`; lo sportello `src/data/health-gate.ts` chiama la funzione del database con la sola chiave pubblica: **nessuna nuova variabile su Vercel**.
- **Database** (migrazioni 10-12, solo aggiunte; `supabase/aggiornamento-fase-5.sql` e `setup.sql` sono generati da `npm run setup-sql`): `ingest_health` (riconosce il codice dall'impronta sha256, limite, scrittura con valori manuali intoccabili, registro in `ingest_log`), `create_health_token` / `revoke_health_token` (il codice nasce nel database e torna all'app una sola volta), colonne `recovery_max_per_day`, `recovery_min`, `credit_cap`. La migrazione 10 toglie all'utente la scrittura diretta su `ingest_log` e `ingest_tokens` (solo lettura).
- **Motore:** `target.ts` riscritto secondo §3.3 (saldo con tetto dopo ogni giorno, recupero 0 sotto `recoveryMin`, al massimo `recoveryMaxPerDay`); nuovo `preview.ts` (`previewDayTarget`, con `today` come parametro); `weekSummary` accetta `today` e il saldo ha il tetto. Il motore resta puro.
- **Schermate:** `health-section.tsx`, `health-warning.tsx`, `lib/health-link.ts` (`shouldWarnHealth`); `week-panels.tsx` e `lib/week-actions.ts`; `swipe-row.tsx` + `swipe-logic.ts`.

### Test
- **561 test in 47 file** (Vitest), tutti verdi; `lint` senza avvisi e `build` passano. In questa fase: 491 → 561.
- **Casi di §3.6:** B, C, D aggiornati; M, N, O, P, Q, R aggiunti; A, E, F, G, H, I, J, K, L con gli stessi risultati. Test del motore toccati perché la regola cambia: `target.test.ts` (B, C, D riscritti; H, «il saldo include i bonus», «domenica» e «la base non scende sotto la soglia» con i nuovi numeri), `week.test.ts` (solo il saldo, ora con il tetto), `settings.test.ts` (tre nuovi default); nuovo `preview.test.ts`.
- **Ingresso:** codice valido, sbagliato, revocato; tutti i formati; riga di tre giorni fa scartata; valore manuale non sovrascritto; invio ripetuto; valore aggiornato; solo passi, solo bici; corpo vuoto o non JSON; limite superato; due utenti.
- **Gesto:** `swipe-logic.test.ts` (soglie, direzione, una riga aperta alla volta) e `npm run prova-scorrimento` (13 controlli con il tocco simulato di Playwright: apertura, pulsanti ≥ 44 px, una sola riga, tocco altrove, destra senza effetto, scorrimento verticale che non si blocca, tocco sulla riga, cestino senza conferma, Preferiti).
- **Screenshot:** 161 scenari × chiaro e scuro a 390 px (322 immagini) in `docs/screenshots/`; in questa fase rigenerati solo quelli degli scenari toccati, più i nuovi (Salute, recupero e anteprima, pannelli della Settimana, scorrimento). Nessuna segnalazione di scorrimento orizzontale o aree sotto 44 px.
- La percentuale di copertura non è misurata.

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali: nessuna variabile nuova su Vercel (il database riconosce l'utente dal codice); la migrazione 10 rende `ingest_log` e `ingest_tokens` di sola lettura per l'utente; una chiamata è «riuscita» solo se almeno una riga è stata salvata o lasciata perché manuale; `1.234` km vale 1,23 (due decimali) e `8.123` passi vale 8123; il saldo di Settimana è quello con il tetto, fino all'ultimo giorno con pasti; oggi nell'anteprima conta almeno come l'obiettivo; `recoveryMin` ha una colonna ma non un campo; «Disattiva» non chiede conferma, «Rigenera» sì; nei pannelli della Settimana il cestino resta visibile oltre allo scorrimento; nuovo colore `--bad-btn` per i pulsanti di eliminazione.

### Limiti e cose non verificate
- **Salute:** la guida `COLLEGA-SALUTE.md` è scritta dai nomi delle azioni dei Comandi rapidi senza averli visti a schermo; nessun Comando rapido vero è mai stato eseguito. Non verificati: nomi esatti delle azioni, unità km e raggruppamento per giorno, formato `yyyy-MM-dd`, permessi di iOS, comportamento delle automazioni a telefono bloccato.
- **Database:** le funzioni SQL (`ingest_health`, `create_health_token`, `revoke_health_token`) sono provate solo su PostgreSQL 16 locale con uno stand-in di Supabase; lo sportello Supabase solo con il database finto; i test automatici dell'ingresso usano un ingresso finto che replica le regole ma non esegue l'SQL.
- **Collegamento nelle schermate:** negli screenshot è simulato con la chiave dimostrativa `personal-health:demo-health` (attiva solo senza Supabase); non visto con un account vero. La copia negli appunti non è provata su iPhone.
- **Gesto di scorrimento:** provato con il tocco simulato di Chromium, solo in Oggi; nei pannelli della Settimana è visto negli screenshot. **Non provato su un iPhone vero.**
- Da fasi precedenti restano non provati dal vero Supabase (accesso, importazione) e Vertex AI.
