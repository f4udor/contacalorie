# Report fase 5b: ritocchi dopo la prova sul telefono

## 1. In parole semplici

**Cosa c'è ora.**
- **Passi in sola lettura.** In Oggi la riga dei passi non si tocca più e dal **+** non si inseriscono più passi: arrivano solo da Salute (e un nuovo invio sostituisce anche un vecchio valore scritto a mano). Un vecchio passo a mano si può solo eliminare, dalla Settimana.
- **Bici a mano che si somma.** Dal **+** la voce è **Bici a mano** (km e, se vuoi, kcal). Si somma ai km arrivati da Salute e Salute non la tocca mai. In Oggi la bici mostra il totale e, se ci sono entrambe le parti, il dettaglio («12,4 km da Salute + 8 km a mano»): si tocca solo la parte a mano, per modificarla o eliminarla. Lo stesso nel pannello Bici della Settimana (aggiungi con «+ A mano», modifica toccando, elimina col cestino o scorrendo).
- **Colori dell'anello delle kcal.** Azzurro (accento) se sei più di 150 kcal sotto l'obiettivo, **verde** da −150 a +50, giallo fino a +200, rosso oltre. Le barre della Settimana usano gli stessi colori. Il recupero del giorno dopo scatta solo da 50 kcal di debito (prima 25), quindi finché l'anello è verde non c'è nessun recupero.
- **Proposta dell'AI più precisa.** Il nome è solo il nome del piatto; la quantità elenca gli ingredienti con i grammi («200 g carne di maiale, 10 g pangrattato, …»); pasta, riso e legumi si intendono **a crudo** salvo che tu dica «cotta», e l'interpretazione è scritta nella quantità, così si vede prima di confermare. Stessa frase, stessa stima (temperatura 0). Le quantità lunghe vanno a capo su due righe e toccando il piatto (o la riga aperta della proposta) si leggono per intero.
- **Pasto libero nella proposta.** Se scrivi «pasto libero: pizza e birra» l'interruttore **Pasto libero** è già acceso nella conferma; si può spegnere. È spento e disattivato se la settimana ne ha già uno; in una proposta con più pasti se ne segna libero uno solo.
- **Controllo di coerenza.** Se le kcal di un piatto stimato dall'AI sono molto più basse di quelle che darebbero proteine, carboidrati e grassi, il piatto mostra «⚠ controlla» e, aperto, «Le kcal sembrano basse rispetto ai nutrienti: controlla i numeri.» Non blocca nulla e non cambia i numeri; ritoccandoli il segno si aggiorna. Lo stesso nel piatto a mano stimato con l'AI.
- **Preferiti eliminabili scorrendo.** Piatti e pasti preferiti si scorrono verso sinistra e compare il cestino (elimina subito). Il pulsante «Modifica» non c'è più; il **+** e il tocco sulla riga aggiungono come prima.
- **Media della settimana sul grafico.** La scheda «Media kcal» ora è la media dei **giorni conclusi** (oggi escluso) e sul grafico c'è una linea tratteggiata grigia alla media, con la legenda «media 2.040» sopra le barre. Senza giorni conclusi: trattino e nessuna linea.
- **Variazione di peso.** Sempre con segno e un decimale: «−0,4 kg», «+0,3 kg»; una differenza che arrotondata vale zero è «0,0 kg» in grigio. Verde se ti avvicini al peso obiettivo, rosso se ti allontani (vale anche se vuoi salire).

**Cosa manca.** Grafici (fase 6) e promemoria (fase 7). Salute, Supabase e Vertex AI restano da provare dal vero.

### Prima del merge: istruzione SQL su Supabase
Apri **Supabase → SQL Editor → New query**, incolla **tutto** il contenuto di `supabase/aggiornamento-fase-5b.sql` ed eseguilo **una volta sola**, poi ripubblica l'app su Vercel. (Chi parte da zero usa invece `supabase/setup.sql`, già aggiornato.) Il file aggiunge due colonne alla bici, sposta nella parte a mano i vecchi valori di bici inseriti a mano, aggiorna la funzione che riceve i dati da Salute e porta a 50 la soglia del recupero dove era ancora 25. Non serve nessuna nuova variabile.

### Cosa provare sul telefono (uno per task)
1. **T5b.0 · Passi e bici.** In Oggi tocca la riga dei passi: non succede nulla. Dal **+** scegli **Bici a mano**, scrivi 8 km e salva: in Oggi la bici mostra il totale e «… da Salute + 8 km a mano» (o «a mano» se non ci sono km da Salute). Tocca «8 km a mano»: si apre il modulo con «Elimina la bici a mano». Rilancia il Comando rapido: la parte a mano resta.
2. **T5b.1 · Anello.** Guarda Oggi in giorni con kcal diverse: azzurro, verde (fino a +50), giallo, rosso; in Settimana le barre hanno gli stessi colori. Con un debito di 40 kcal il giorno dopo non c'è recupero; con 50 sì (−50).
3. **T5b.2 · Ricetta e crudo** (serve Vertex collegato). Scrivi «pasta al pomodoro 100 g»: la quantità deve dire «100 g pasta a crudo, 80 g sugo…» e le kcal essere circa 400-450. Con «100 g di pasta cotta al pomodoro» circa 130-150. Ripeti la stessa frase: stessa stima.
4. **T5b.3 · Pasto libero.** Scrivi «pasto libero: pizza margherita e una birra»: l'interruttore è già acceso. Se la settimana ha già un pasto libero è spento e disattivato.
5. **T5b.4 · Controllo.** Apri un piatto della proposta e porta le kcal a un valore molto basso rispetto ai nutrienti (per esempio 110 con 72 g di carboidrati): compare «⚠ controlla». Rialzale e il segno sparisce.
6. **T5b.5 · Preferiti.** Apri **+ → Preferiti** e scorri una riga a sinistra: compare il cestino e il piatto sparisce subito. «Modifica» non c'è più; il **+** aggiunge ancora.
7. **T5b.6 · Media.** In Settimana: la scheda dice «sui giorni conclusi» e sul grafico c'è la linea tratteggiata con «media N» in alto. Il lunedì, con pasti solo di oggi, non c'è media.
8. **T5b.7 · Peso.** Nella scheda Peso della Settimana la differenza ha sempre segno e un decimale («−0,4 kg»); due pesate quasi uguali danno «0,0 kg» in grigio.

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T5b.0 Passi in sola lettura, bici a mano che si somma | fatto |
| T5b.1 Colori dell'anello delle kcal | fatto |
| T5b.2 Proposta dell'AI: ricetta, regola del crudo, stima stabile | fatto (respinto una volta: il campo Quantità aperto era a riga singola e il testo restava tagliato; ora è un campo a più righe) |
| T5b.3 Pasto libero nella proposta dell'AI | fatto |
| T5b.4 Controllo di coerenza tra kcal e nutrienti | fatto |
| T5b.5 Preferiti eliminabili scorrendo | fatto |
| T5b.6 Media della settimana sul grafico | fatto |
| T5b.7 Segno della variazione di peso | fatto |
| T5b.8 Report di fase | questo file |

Nessun task `bloccato`: nessun ultimo tentativo da fare a fine fase. I commit «in attesa di revisione» sono richiesti dal controllo di fine sessione (ogni task ha poi un commit di approvazione con stato e diario).

### Come sono fatte le cose
- **Motore** (`src/engine`, resta puro): `activity.ts` (`bikeKmTotal`, `bikeKcal` con parte di Salute + parte a mano), `defaults.ts` (`ringGreenBelow` 150, `ringGreenAbove` 50, `ringYellowAbove` 200, `kcalCheckShare` 0,20, `kcalCheckMin` 40; `recoveryMin` = `ringGreenAbove`), `traffic.ts` (`RingColor` col verde), nuovo `coherence.ts` (`kcalFromMacros`, `needsKcalCheck`), `week.ts` (media kcal senza oggi).
- **Dati:** `ActivityRecord` con `bikeKmManual` e `bikeKcalManual` (browser, Supabase, importazione, CSV); `normalizeActivity` porta al nuovo formato i dati del browser salvati prima (un vecchio valore di bici «manuale» passa nella parte a mano).
- **Database** (migrazioni 13-14, solo aggiunte più due `update`; `supabase/aggiornamento-fase-5b.sql` e `setup.sql` generati da `npm run setup-sql`): `bike_km_manual`, `bike_kcal_manual`; `ingest_health` riscritta (i passi sostituiscono anche il manuale, la bici scrive solo la parte di Salute, `kept` sempre vuoto); `recovery_min` 25 → 50.
- **Modulo AI:** `prompt.ts` riscritto (regole di nome, quantità, crudo/cotto, pasto libero; tre esempi), schema con `freeMeal`, temperatura 0, quantità fino a 500 caratteri; provider finto con quantità nel nuovo formato.
- **Schermate:** `activity-card.tsx`, `BikeForm`, `week-panels.tsx` (bici), `free-meal-switch.tsx` (estratto da `meal-form.tsx`), `ai-estimate.tsx` (interruttore e controllo), `favorites-view.tsx` (con `SwipeRow`), `week-chart.tsx` (legenda e linea della media), `format.ts` (`formatWeightDelta`).

### Test
- **632 test in 48 file** (Vitest), tutti verdi; `lint` senza avvisi e `build` passano. In questa fase: 561 → 632 (da 47 a 48 file). La percentuale di copertura non è misurata.
- **Motore:** casi E e F invariati (test non toccati); nuovi test per bici solo Salute / solo a mano / entrambe / kcal a mano presenti e assenti; caso S con i sei valori di confine, giorno senza pasti, pasto libero col tetto (in `today-view.test.ts`); caso Z; casi T, U, V con le soglie esatte e i numeri a zero; casi W, X, Y.
- **Test del motore toccati perché la regola cambia** (come previsto dai task): `traffic.test.ts` (anello), `settings.test.ts` (default `recoveryMin` 50), `target.test.ts` (soglia 50/49 al posto di 25/24, più caso Z), `week.test.ts` (solo l'aggiunta di `today` nella costruzione del riepilogo di una settimana conclusa). Fuori dal motore: `week-view.test.ts` (giovedì 1.900 su 2.000 ora verde).
- **Altri:** ingresso (passi che sostituiscono il manuale, parte a mano intatta), validazione AI (`freeMeal`, quantità lunghe), prompt e temperatura, interruttore del pasto libero (acceso, spento, bloccato, due pasti, fascia fissata, cambio di fascia), eliminazione dei preferiti, `formatWeightDelta` e colore del peso (anche per chi vuole salire), CSV con le due parti.
- **Gesto:** `npm run prova-scorrimento` ora ha 20 controlli (13 di prima più 7 sui preferiti: niente «Modifica», una sola riga aperta, cestino per piatto e per pasto, il tocco aggiunge ancora, scorrimento verticale).
- **Screenshot:** 189 scenari × chiaro e scuro a 390 px in `docs/screenshots/`; rigenerati solo gli scenari toccati da ogni task, più i nuovi. Rimossi `preferiti-modifica` e `preferiti-elimina` (la modalità non esiste più). Nessuna segnalazione di scorrimento orizzontale o aree sotto 44 px negli scenari rigenerati.
- **Migrazione su PostgreSQL 16 locale** (stand-in di Supabase): dati di prova con bici «manuale» spostata nella parte a mano senza perdite, `ingest_health` con passi che sostituiscono il manuale e parte a mano intatta dopo due invii, codice sbagliato rifiutato; `update` della soglia.

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali:
- Parte a mano della bici: servono km o kcal (almeno uno, maggiori di zero); `lasciate_manuali` nella risposta dell'ingresso resta sempre vuota, per compatibilità.
- `recovery_min`: la colonna non ha un valore predefinito (vuota = valore dell'app, ora 50); la migrazione porta a 50 solo le righe che avevano 25.
- Quantità: limite di 500 caratteri (prima 200).
- Pasto libero nella proposta: con la fascia fissata il segnale del modello è ignorato (l'interruttore parte dal pasto esistente ma si può cambiare); dopo «Rifai la stima» l'interruttore riparte dalle regole iniziali.
- Controllo di coerenza: nel piatto a mano compare solo dopo «Stima con AI» e sui numeri correnti; se il modello divide il piatto il controllo è sulla somma.
- Media: l'etichetta «media N» sta in una legenda sopra le barre (con «obiettivo»), non accanto alla linea; solo la media delle kcal esclude oggi.
- Peso: `formatWeightDelta` per i kg; la fase 6 dovrà usare lo stesso formato.

### Limiti e cose non verificate
- **Qualità delle stime con il modello vero** (ricetta nella quantità, regola del crudo, stabilità a temperatura 0, riconoscimento del pasto libero): non verificata; prompt e richiesta provati solo con test sul testo e con una `fetch` finta.
- **Database:** migrazioni 13-14 e `ingest_health` provate a mano su PostgreSQL 16 locale con stand-in di Supabase; i test automatici controllano solo il testo dell'SQL; nulla provato su Supabase vero.
- **Gesto di scorrimento** (anche nei preferiti, dentro il pannello che sale dal basso): provato con il tocco simulato di Chromium, non su un iPhone vero.
- **Screenshot:** il confronto pixel per pixel con le immagini vecchie non è affidabile (rumore di rendering), quindi gli scenari «toccati» sono stati scelti ragionando su ogni task; qualche immagine di uno scenario non toccato può non riflettere i ritocchi più piccoli (per esempio la nuova etichetta «Bici a mano» nel menu del pannello Aggiungi, rigenerata solo negli scenari che la mostrano).
- Da fasi precedenti restano non provati dal vero: Salute (Comando rapido), Supabase (accesso, importazione) e Vertex AI.
