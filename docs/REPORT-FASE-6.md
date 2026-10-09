# Report fase 6: testi e grafica

## 1. In parole semplici

**Cosa c'è ora.** L'app ha un aspetto nuovo, ispirato all'app Fitness di Apple: **solo tema scuro, su nero pieno**, con un solo colore di comando (verde lime) e blu, giallo e rosso riservati ai giudizi. Nessuna funzione è cambiata, tranne quattro piccole aggiunte (sotto). Tutti i testi sono stati rivisti secondo la tabella che hai approvato (`docs/TESTI.md`): «Calorie» al posto di «Kcal», «Pasto» al posto di «Fascia», «Uscita in bici» al posto di «Bici a mano», «Rimuovi» / «Elimina» al posto di «Togli», niente più rimandi a file.

**Le quattro aggiunte.**
1. Nei pannelli della Settimana ci sono le frecce per cambiare settimana.
2. Nella Settimana c'è il tasto «Aggiungi pasto libero».
3. L'Uscita in bici ha la riga «Giorno» (calendario di sistema).
4. In Impostazioni → Collegamenti compaiono il nome del modello (per esempio «Gemini 2.5 Flash») e le stime di oggi («4 di 60»).

**Cosa guardare sul telefono, schermata per schermata.**
- **Barra in basso:** tre voci (Oggi, Settimana, Grafici); quella attiva ha la pillola scura con l'icona verde. Il tasto **+** è sopra la barra, solo in Oggi. Impostazioni è l'ingranaggio in alto a destra.
- **Oggi:** scheda Calorie con l'anello («Rimaste» / «Oltre», «2.061 di 2.100»), schede dei nutrienti con la barretta nel colore dello stato, pasti con i piatti, Passi e Bici affiancati. Scorrendo un piatto a sinistra: «Salva nei preferiti» (o «Rimuovi dai preferiti») e cestino.
- **Settimana:** sette barre nel colore dello stato, linea dell'obiettivo a gradini e linea tratteggiata della media; sotto, le schede Saldo, Media, Passi, Bici, Peso, Pasto libero e Medie dei nutrienti. Toccandole si apre il pannello, con le frecce della settimana.
- **Tasto + e pannelli:** scheda del piatto con AI e Manuale, proposta dell'AI con i piatti da toccare per correggere, Preferiti, Pesata, Uscita in bici. Tutti salgono dal basso.
- **Impostazioni:** elenchi con il valore a destra («98,6 kg → 90 kg»); «Esporta i dati» in verde, «Esci» in rosso. Collegamenti è staccata in fondo.
- **Collegamenti:** sezioni «Salute» (Stato, Ultimo invio, Ricevuti oggi/ieri, Crea/Rigenera il codice, Disattiva) e «Stime dei pasti» (Modello, Stato, Stime di oggi).
- **Primo avvio e accesso:** stesso stile, stessi passi («Inizia» al posto di «Fine»).
- **Grafici:** solo lo stile nuovo, ancora «In arrivo».

**Cose che si giudicano solo su un iPhone vero** (qui non si possono provare): la sfocatura «a vetro» della barra, del tasto + e dell'intestazione; la scorrevolezza della pagina con il vetro; il tasto + a fine pagina (non deve coprire l'ultima scheda); il carattere arrotondato dei numeri grandi; il calendario di sistema per «Giorno»; la tastiera sulle nuove righe dei campi e sulla schermata di accesso.

**Cosa manca.** Il nome del modello e le stime di oggi non sono stati visti con un server vero (negli screenshot sono simulati). Grafici resta «In arrivo».

## 2. Tecnica

**Task chiusi (tutti `fatto`, nessuno `bloccato`).**
- T6.0 fondamenta: `globals.css` unico file con ruoli (§10.2), raggi e caratteri; componenti condivisi in `components/ui/ui.tsx`; pagina `/prova-stile`.
- T6.1 navigazione: barra in vetro, tasto +, intestazione di Oggi e Settimana.
- T6.2 Oggi.
- T6.3 Settimana e relativi pannelli (respinto una volta: mancava il test del cambio di settimana, ora `panelWeekReducer`).
- T6.4 pannelli di inserimento (scheda del piatto, proposta AI, Preferiti, Pesata, Uscita in bici con «Giorno»).
- T6.5 Impostazioni, Collegamenti, Dati, accesso, primo avvio, Grafici (respinto una volta: mancava lo screenshot di Grafici; `GET /api/estimate` espone modello, limite e stime di oggi, `AiProvider.model`, `fetchUsedToday`).
- T6.6 passata finale (respinto una volta: guide con nomi vecchi, «Togli» e una frase del primo avvio): tolti i nomi di colore vecchi, `field.tsx`, i file `-chiaro`; guide `docs/COLLEGA-*.md` allineate, `COLLEGA-SALUTE.md` spiega il filtro «Sorgente è».

**Test.** 59 file, 867 test, tutti passati (`npm test`); `npm run lint` e `npm run build` puliti. Nuovi controlli automatici: `tools/testi.test.ts` (nessun vecchio testo di `docs/TESTI.md` come frase intera nelle schermate; nessun comando «Togli…») e `tools/stile.test.ts` (nessun colore, raggio o carattere scritto a mano fuori da `globals.css`; nessun `-chiaro`). Test nuovi o estesi per la geometria del grafico settimanale, la navigazione, il cambio settimana nei pannelli, il nome del modello, la lettura delle stime di oggi e il client della route. Nessun test del motore è stato toccato; `src/engine`, `src/data` e il database sono invariati; nessun SQL; nessuna nuova dipendenza.

**Screenshot.** 248 file in `docs/screenshots/`, solo scuri a 390 px; ogni task ha rigenerato solo gli scenari toccati. Nessun file `-chiaro`.

**Decisioni da confermare** (dettaglio in `docs/DIARIO.md`): il tasto + resta solo in Oggi; «Obiettivo 2.100» sotto il numero nei giorni senza pasti; saldo negativo in colore Testo; «Pasto» come menu di sistema; la X dei sotto-pannelli di Aggiungi torna ad Aggiungi; «Esporta i dati» apre la pagina Dati invece di scaricare; «Modello» e «Stime di oggi» compaiono solo se il server li conosce; eccezioni al controllo di stile (`#000000` in `layout.tsx` e `manifest.ts`, `font-mono` per il codice di Salute); il tasto «Rimuovi da questo dispositivo» è un tasto pieno come gli altri (non esiste un tasto pieno rosso in §10.3).

**Limiti e cose non verificate.** Vetro, aree sicure, prestazioni di scorrimento, calendario di sistema, tastiera e carattere arrotondato non sono verificati su iPhone (solo Chromium e tocco simulato). Nome del modello e conteggio delle stime provati solo con risposte finte. Il controllo dei testi guarda le schermate (`.tsx` in `src/app`) e una lista di frasi: nomi interni come «libero» e «manuale» (valori di tipi) restano fuori.
