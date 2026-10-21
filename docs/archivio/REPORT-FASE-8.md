# Report fase 8: ritocchi dei flussi

## 1. In parole semplici

**Nessun SQL da eseguire.** Questa fase non cambia il database: usa le colonne che già ci sono (il campo «Ingredienti» è la vecchia colonna della quantità).

**Cosa c'è ora.**
- La scheda del piatto in Manuale ha l'ordine **Nome, Peso (g), Ingredienti**, poi «Stima con l'AI», poi i numeri. «Quantità» si chiama «Ingredienti» ovunque (anche nel file CSV). Sono sparite la riga «Porzioni» e l'interruttore «Pasto libero»; la riga «Pasto» c'è solo se non l'hai già scelto («Aggiungi piatto» di un pasto).
- «Stima con l'AI» manda al modello nome, peso e ingredienti: se scrivi il peso, la stima è per quel peso e la riga sotto il tasto dice «Stimati dall'AI per 150 g».
- Se dici i grammi di un preferito che non ha il peso, nel piatto compare la domanda **«Quanto pesava la porzione salvata?»** con «Salta»; rispondendo, numeri e peso si ricalcolano subito e il preferito prende il peso solo quando confermi.
- Salvando nei preferiti un piatto senza peso sale un pannello piccolo con nome e **Peso facoltativo**.
- Scorrendo un preferito verso sinistra: **«Modifica»** (solo piatti) ed «Elimina».
- «ipotizzata» compare solo se per il piatto non hai detto nessuna quantità.
- Settimana: sotto il **Saldo** c'è «di margine», «da recuperare» o «in pari»; Oggi: la riga sotto l'anello dice sempre almeno «Base 2.100» e la scheda Calorie ha la stessa altezza ogni giorno.
- Nel pannello Aggiungi resta **un solo tasto «Preferiti»**, quello nel campo: elenca pasti e piatti, un tocco mette l'etichetta (con il bordo verde per un pasto). Se nel campo ci sono solo etichette e quantità semplici («150 g», «2 porzioni», «×2», «mezza porzione»), «Stima» compone la proposta da sola, **senza AI** e senza consumare le stime del giorno.

**Un controllo da fare sul telefono per ogni task, partendo da «Aggiungi piatto» a pranzo in Manuale con nome e peso.**
- **T8.0.** In Oggi tocca «+ Aggiungi piatto» sotto Pranzo, vai su Manuale: scrivi il nome (per esempio «Hummus»), «Peso (g)» 150 e gli ingredienti, tocca «Stima con l'AI»: i numeri compaiono e sotto il tasto leggi «Stimati dall'AI per 150 g». Non ci sono né «Porzioni» né «Pasto libero» né la riga «Pasto». Salva.
- **T8.1.** Salva un piatto senza peso nei preferiti (scorri il piatto a sinistra → «Salva nei preferiti»): sale il pannello con il campo Peso; prova «Salva» con il campo vuoto. Poi in Aggiungi (AI) metti un preferito senza peso con «100 g» e «Stima»: appare «Quanto pesava la porzione salvata?»; scrivi 80 e guarda le calorie ricalcolarsi.
- **T8.2.** Apri l'elenco dei preferiti (tasto «Preferiti» nel campo), scorri un piatto a sinistra: «Modifica» ed «Elimina». Cambia il nome e salva; un pasto salvato ha solo «Elimina».
- **T8.3.** Scrivi «200 g di petto di pollo»: nella proposta non deve comparire «ipotizzata». Scrivi «pasta al pomodoro» senza quantità: deve comparire. (Dipende anche dal modello vero: vedi sotto.)
- **T8.4.** In Oggi guarda un giorno senza bici: sotto l'anello c'è «Base 2.100» e la scheda ha la stessa altezza degli altri giorni. In Settimana, il Saldo dice «di margine» o «da recuperare»; a inizio settimana ha il trattino senza riga sotto.
- **T8.5.** In Aggiungi, sotto il campo restano solo «Pesata» e «Uscita in bici». Tocca «Preferiti» nel campo, scegli un pasto e un piatto, scrivi «2 porzioni», tocca «Stima»: la proposta compare subito, senza attesa dell'AI.

**Cosa manca.** Niente da completare in questa fase. Settimana, Grafici e la barra non sono stati toccati (se non per il Saldo): cambiano nella fase 9 (Trend).

## 2. Tecnica

**Task chiusi (tutti `fatto`, nessuno `bloccato`; nessuna revisione respinta).**
- T8.0: `MealForm` (ordine, «Ingredienti», `dishSheetFields`), `composeDishText` e `estimateDish` (testo «Piatto / Peso / Ingredienti»), prompt e provider finto che rispettano il peso scritto, intestazione del CSV.
- T8.1: motore `favoriteDishFromQuantity` con `needsWeight` al posto dell'avviso (caso AS aggiornato, unico test del motore cambiato); `answerWeightAsk`, `skipWeightAsk`, `favoritesToUpdate`; `SaveFavoritePanel`, `needsWeightPrompt`, `saveFavoriteDishAs`.
- T8.2: `EditFavoritePanel`, `favoriteToForm`/`favoriteFromForm`, `favoriteRowActions`; tono «tessera» per `SwipeAction`; correzione degli id duplicati dei campi (`idPrefix` in `MealForm`).
- T8.3: causa nell'app = caso AS segnato «ipotizzata» (T8.1); il resto è del modello: prompt rinforzato con regola ed esempi; provider finto che distingue i casi; `assumed-quantity.test.ts`.
- T8.4: `balanceCaption`, `hasCompositionDetail` sempre vero; misure in `prova-comandi`.
- T8.5: `label-only.ts` (`parseSimpleQuantity`, `labelOnlyPlan`, `slotFromTime`, `routeEstimate`); etichette di pasto (`Segment.favoriteKind`, `PickedFavorite`, `buildModelText` con `mealRefs`); `kind` nello schema, nel prompt e nella validazione; `FavoritePicker` unico (al posto di `FavoritesView`, rimosso).

**Test.** 64 file, 1.028 test passati (`npm test`); `npm run lint` e `npm run build` puliti; `npm run prova-comandi` (112 controlli) e `npm run prova-scorrimento` (26) passano. Nel motore cambia solo `portion.ts` (e il test del caso AS): nessun caso da A ad AM né AN-AR, AT-AU modificato. Sono stati aggiornati alcuni test di `src/app/lib` per le intestazioni rinominate. 273 scenari, screenshot scuri a 390 px in `docs/screenshots/` (rigenerati tutti); tolti 9 scenari che mostravano righe eliminate e `settimana-tocco-barra` (già non più valido dalla fase 6b, tornerà con T9.1).

**SQL.** Nessuno. Nessuna migrazione, nessun file in `supabase/`.

**Decisioni da confermare** (dettaglio in `docs/DIARIO.md`): un numero di pezzi detto («due uova», «una mela») vale come quantità detta; «Aggiungi pasto libero» dalla Settimana apre Manuale con il pasto già libero ma senza interruttore visibile; l'elenco dei preferiti nel campo include anche «Modifica»/«Elimina» (prima nel pannello tolto); `recordsFromFavoriteDish` e `recordsFromFavoriteMeal` non servono più alle schermate (restano con i test).

**Limiti e cose non verificate.**
- Il comportamento del **modello vero** non è verificato per: testo «Piatto / Peso / Ingredienti», regola di «ipotizzata» con gli esempi nuovi, etichette di pasto (`kind: "pasto"`). Prompt e schema sono provati solo con test sul testo e con il provider finto.
- Tutte le prove di interazione (pannello piccolo, domanda sul peso, scorrimento a due tessere, etichette, tastiera numerica, microfono) sono fatte con Chromium e tocco simulato, **non su un iPhone vero**.
- La riga di composizione più lunga sta in una riga a 390 px; a 375 px non misurata.
- La fascia di «solo etichette» usa l'ora del telefono; nei test e negli screenshot l'ora è finta.
