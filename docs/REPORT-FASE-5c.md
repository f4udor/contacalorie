# Report fase 5c: scheda del piatto, preferiti, obiettivi calcolati, Impostazioni

## 1. In parole semplici

**Cosa c'è ora.**
- **Una sola scheda per il piatto.** Aggiungere un piatto (dal **+** o da «+ Aggiungi piatto») e modificarne uno (toccandolo in Oggi) usa la stessa scheda. In alto: **Chiudi** a sinistra, il titolo, **Salva** a destra, sempre visibili anche scorrendo. Salva è spento finché non c'è niente da salvare. In fondo non ci sono più pulsanti di salvataggio. Sotto il titolo c'è **AI | Manuale**: l'aggiunta si apre su AI, la modifica su Manuale. In Manuale c'è sempre «Stima con l'AI», che sostituisce i numeri già scritti. In modifica, su AI, scrivi «era di più» e la stima nuova compare nella stessa scheda; **Salva** la applica. Passando da AI a Manuale e ritorno non si perde nulla. In modifica, in fondo e separati, ci sono «Salva nei preferiti» (o «Rimuovi dai preferiti») ed «Elimina piatto». Anche **Pesata** e **Bici a mano** hanno Salva in alto.
- **Preferiti senza doppioni.** Un piatto è già tra i preferiti se ce n'è uno con lo stesso nome e la stessa quantità (maiuscole e spazi non contano). In quel caso, scorrendo il piatto o aprendolo, compare **Rimuovi dai preferiti**, che lo toglie subito. Salvare di nuovo un piatto o un pasto con lo stesso nome aggiorna la riga e non ne crea una seconda.
- **Linea della media di un altro colore.** La linea tratteggiata della media (e la sua voce in legenda) è viola, diversa dalla linea dell'obiettivo e dai colori del semaforo.
- **Obiettivi calcolati dal profilo.** Dal sesso, dall'età, dall'altezza e dal peso (l'ultima pesata, se c'è) l'app calcola il metabolismo basale e le kcal base; se hai un peso obiettivo e una data, tiene conto anche di quanto devi scendere (o salire) ogni giorno. La base non scende mai sotto il metabolismo basale. Se la data è troppo vicina, la base resta al minimo e l'app ti dice la prima data possibile. **Chi aveva già una kcal base salvata la tiene** come personalizzata: i suoi numeri non cambiano da soli (cambia solo la soglia minima, che diventa il basale quando il profilo è completo).
- **Impostazioni a sezioni.** La prima pagina è un elenco senza campi: Profilo, Obiettivi, Attività, Pasto libero, Dati e, staccata, Collegamenti, ciascuna con un riassunto a destra («2.140 kcal», «Salute collegata»). Ogni riga apre la sua pagina con **Indietro**. In **Obiettivi** kcal base, proteine e grassi dicono «calcolato» o «personalizzato» (scrivere un numero lo rende personalizzato, «Usa il valore calcolato» lo riporta alla formula); il metabolismo basale è in sola lettura; se il piano non è raggiungibile c'è la prima data possibile con il pulsante «Imposta questa data»; con il profilo incompleto c'è l'invito a completarlo. Il campo «soglia minima» non c'è più. «Ripristina valori predefiniti» è ora nella pagina Dati.
- **Primo avvio più completo.** Chiede sesso, età, altezza, peso, peso obiettivo e data, poi mostra le kcal base calcolate e il metabolismo basale, con la possibilità di cambiare la base a mano. Chi lo ha già fatto non lo rivede.

**Cosa manca.** Testi e grafica (fase 6), Grafici (fase 6b), promemoria (fase 7). Salute, Supabase e Vertex AI restano da provare dal vero.

### Prima del merge: istruzione SQL su Supabase
Apri **Supabase → SQL Editor → New query**, incolla **tutto** il contenuto di `supabase/aggiornamento-fase-5c.sql` ed eseguilo **una volta sola**, poi ripubblica l'app su Vercel. (Chi parte da zero usa invece `supabase/setup.sql`, già aggiornato.) Il file aggiunge due colonne alle impostazioni: il sesso e la data entro cui raggiungere il peso obiettivo. Non toglie né rinomina nulla e non serve nessuna nuova variabile.

### Cosa provare sul telefono (uno per task)
1. **T5c.0 · Scheda del piatto.** Tocca un piatto in Oggi: si apre su Manuale con Chiudi · titolo · Salva in alto; Salva è spento finché non cambi qualcosa. Apri la tastiera e scorri la scheda: l'intestazione resta visibile (è la cosa da guardare sul telefono vero). Cambia le kcal e premi Salva. Prova poi AI, scrivi «la porzione era più grande» e premi «Rifai la stima» (serve Vertex collegato).
2. **T5c.1 · Preferiti.** Scorri un piatto a sinistra e premi «Preferiti»; scorri di nuovo lo stesso piatto: ora dice «Rimuovi dai preferiti». Premilo: il piatto non è più tra i preferiti e l'etichetta torna «Preferiti».
3. **T5c.2 · Linea della media.** In Settimana, con almeno un giorno concluso, la linea tratteggiata della media è viola e si distingue dalla linea nera/bianca dell'obiettivo, in tema chiaro e scuro.
4. **T5c.3 · Obiettivi calcolati.** Compila il profilo e guarda in Oggi l'obiettivo: con profilo completo e senza kcal base scritta a mano è quello calcolato. Se avevi già una kcal base, deve essere rimasta uguale.
5. **T5c.4 · Impostazioni.** Apri Impostazioni: solo righe con riassunto. Entra in Obiettivi: scrivi un numero nelle kcal base e l'etichetta diventa «personalizzato»; premi «Usa il valore calcolato». Metti nel Profilo una data molto vicina e controlla la riga con la prima data possibile; premi «Imposta questa data». Il selettore della data si apre in italiano sull'iPhone (da verificare).
6. **T5c.5 · Report.** Questo file.

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T5c.0 Scheda del piatto unica | fatto |
| T5c.1 Preferiti senza doppioni | fatto |
| T5c.2 Colore della linea della media | fatto |
| T5c.3 Obiettivi calcolati dal profilo | fatto |
| T5c.4 Impostazioni a sezioni e primo avvio | fatto |
| T5c.5 Report di fase | questo file (respinto una volta: il numero dei test di partenza era sbagliato, corretto) |

Nessun task `bloccato`: nessun ultimo tentativo da fare a fine fase. I task da T5c.0 a T5c.4 sono stati approvati dal subagente `revisore` al primo passaggio e hanno un solo commit (con codice, test, scenari, stato in `docs/TASKS.md` e riga del diario).

### Come sono fatte le cose
- **Motore** (`src/engine`, resta puro): nuovo `profile.ts` con `computePlan` (basale Mifflin-St Jeor, minimo arrotondato alla decina, fabbisogno × `sedentaryFactor`, scarto al giorno, kcal base calcolata, piano non raggiungibile con giorni e data della prima possibilità) e `resolveSettings` (unico punto da cui le regole prendono kcal base e soglia minima: a mano se c'è, altrimenti calcolata, con profilo incompleto i default). Costanti `sedentaryFactor` 1,2 e `kcalPerKg` 7.700 in `defaults.ts`. «Oggi» è sempre un parametro. Nessun test esistente del motore è stato toccato (casi A-Z invariati).
- **Dati:** `UserSettings` con `sex` e `targetDate` (browser, Supabase, importazione); migrazione 0015 (`sex`, `target_date`); `supabase/aggiornamento-fase-5c.sql` e `setup.sql` generati da `npm run setup-sql`. Gli aggiornamenti delle fasi 5 e 5b restano limitati alle migrazioni 10-14.
- **Schermate:** `Sheet` con intestazione a barra (`bar`, `subHeader`); `useDishForm` (stato unico dei due modi), `dish-sheet.ts`, `DishEditAi`, `AiEstimate` senza Conferma/Annulla (si conferma con Salva); `favorites.ts` (`sameKey`, `isFavoriteDish`, `toggleFavoriteDish`); `--avg-line` in `globals.css`; `settings-sections.ts`, `settings-fields.tsx`, `settings-pages.tsx`, `settings-list.tsx`; primo avvio in tre schermate (`onboarding.ts`).

### Test
- **703 test in 52 file** (Vitest), tutti verdi; `lint` senza avvisi e `build` passano. In questa fase: 632 → 703 (da 48 a 52 file; nuovi file: `dish-sheet`, `avg-line-color`, `profile`, `settings-sections`). La percentuale di copertura non è misurata (manca lo strumento di copertura).
- **Motore:** casi da AA ad AH con i numeri esatti, più data passata, peso obiettivo già raggiunto, peso preso dall'ultima pesata invece che dal profilo, utente esistente con base salvata, chi vuole salire, arrotondamento «lontano dallo zero» dello scarto.
- **Altri:** stato di «Salva» (aggiunta, modifica, occupato), stima che sostituisce i numeri, correzione a parole; preferiti (maiuscole e spazi, quantità diversa, salva-rimuovi-salva, pasto con lo stesso nome); contrasto e variabile del colore della media; riassunti delle righe, pagine, etichette calcolato/personalizzato, prima data possibile; primo avvio (campi, riepilogo AB/AC/AH); validazione per pagina, sesso e data; `loadWeekData` con profilo completo, base salvata, pesata, profilo incompleto; sportello (sesso e data in memoria, browser e Supabase finto); `setup.sql` e `aggiornamento-fase-5c.sql` aggiornati.
- **Screenshot:** 222 scenari × chiaro e scuro a 390 px in `docs/screenshots/`; rigenerati solo gli scenari toccati da ogni task (pannelli del piatto e dell'aggiunta, scorrimento e preferiti, `settimana-media-*`, `impostazioni-*`, `primo-avvio-*`, collegamenti e Salute per il cambio di indirizzo). Nessuna segnalazione di scorrimento orizzontale o aree sotto 44 px. Rimossi `impostazioni-predefinite`, `-compilate`, `-errori`, `-salvato` (sostituiti dalle pagine nuove).

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali:
- Scheda del piatto: Salva spento in aggiunta finché non è scritto qualcosa e in modifica finché nulla è cambiato; niente più «Annulla» né ritorno al campo di testo dalla proposta (si chiude con Chiudi).
- «Rimuovi dai preferiti» toglie anche gli eventuali doppioni già presenti dello stesso piatto (altrimenti l'etichetta non cambierebbe); gli accenti contano nel riconoscere lo stesso piatto.
- Obiettivi: con profilo incompleto la base si chiama «predefinito»; il «metabolismo basale» mostrato è il minimo usato (arrotondato alla decina); chi vuole salire ha uno scarto negativo (base sopra il fabbisogno); una data uguale a oggi vale come passata.
- Impostazioni: pagine come indirizzi `?s=…`; «Salva» per ogni pagina con campi; «Ripristina valori predefiniti» nella pagina Dati (toglie anche la vecchia soglia minima salvata); fibre e sale restano modificabili in Obiettivi.
- Primo avvio: la kcal base si salva solo se scritta a mano; tutti i campi sono facoltativi.

### Limiti e cose non verificate
- **Tastiera dell'iPhone:** l'intestazione fissa della scheda con la tastiera vera, il selettore di data in italiano e la tastiera numerica per i decimali non sono verificati (negli screenshot la tastiera non c'è).
- **Database:** la migrazione 0015 (due colonne) non è stata eseguita su un database vero; lo sportello Supabase legge e scrive `sex` e `target_date` solo con il database finto. Il formato della colonna `date` («AAAA-MM-GG») è assunto.
- **Qualità delle stime con il modello vero** (anche la correzione a parole in modifica): non verificata, solo `fetch` finta e provider finto.
- **Il colore della media** è verificato con il contrasto calcolato e con gli screenshot, non su uno schermo vero.
- Da fasi precedenti restano non provati dal vero: Salute (Comando rapido), Supabase (accesso, importazione), Vertex AI, gesto di scorrimento su iPhone.
