# Report fase 7: preferiti nella stima

## 1. In parole semplici

**Prima del merge: un'istruzione SQL da eseguire su Supabase.** Apri Supabase → SQL Editor → New query, incolla tutto il contenuto di `supabase/aggiornamento-fase-7.sql` ed esegui **una volta sola**. Aggiunge una colonna facoltativa «peso in grammi» ai piatti e ai preferiti; non cancella né cambia nulla. Chi parte da zero usa `supabase/setup.sql`, già aggiornato. Senza questo passaggio, con Supabase collegato il salvataggio dei piatti darebbe errore.

**Cosa c'è ora.**
- Ogni piatto può avere un **peso in grammi**. Il modello lo indica per i piatti che stima (somma dei grammi scritti nella quantità, a crudo per la pasta); a mano c'è il campo «Peso (g)».
- Cambiando il peso (o le **porzioni**, se il piatto non ha un peso) calorie e nutrienti si ricalcolano subito, senza AI.
- Nel campo «Cosa hai mangiato?» il tasto **Preferiti** mette un piatto salvato come **etichetta** dentro la frase. Il modello non lo stima: capisce solo in che pasto va e che quantità hai detto (grammi o porzioni); i numeri li calcola l'app dal tuo preferito.

**Un controllo da fare sul telefono per ogni task, partendo dal salvataggio di un piatto con il peso.**
- **T7.0, peso del piatto.** In Aggiungi → Manuale scrivi nome, quantità e «Peso (g)» (per esempio 150), poi le calorie e salva. Riapri il piatto da Oggi: il peso c'è. Aprilo, tocca «Salva nei preferiti» e controlla che nei Preferiti ci sia. Prova anche «Esporta i piatti»: nel file c'è la colonna «Peso (g)».
- **T7.1, quantità ricalcolata.** Apri un piatto con il peso (per esempio 200 g, 300 kcal): scrivi 250 nel campo «Peso (g)» e guarda le calorie salire (375) senza aspettare; riscrivi 200 e tornano 300. Su un piatto senza peso usa le scelte ×0,5, ×1, ×1,5, ×2 della riga «Porzioni». Se scrivi a mano un numero dopo il ricalcolo, quel numero resta com'è.
- **T7.2, etichette dei preferiti.** In Aggiungi (AI) tocca «Preferiti» sotto il campo, scegli un piatto: compare come tessera nella frase. Scrivi dopo «100 g», aggiungi un'altra etichetta, tocca «Stima»: i piatti «dai tuoi preferiti» hanno le calorie del tuo preferito in proporzione. Un solo tasto indietro cancella un'etichetta. Prova anche a dettare del testo prima e dopo l'etichetta con il microfono della tastiera.

**Cosa manca.** Niente da completare in questa fase. Restano fuori, come deciso, la tabella degli ingredienti con valori ufficiali (fase 7b), i prodotti di marca da Open Food Facts (7c) e il riconoscimento dei preferiti senza etichetta.

## 2. Tecnica

**Task chiusi (tutti `fatto`, nessuno `bloccato`; nessuna revisione respinta).**
- T7.0: colonna `weight_g` in `meals` e `favorites` (migrazione 16, solo aggiunte, check > 0), campo `weightG` nei piatti di `favorite_meals`; sportello (browser e Supabase), tipi, CSV («Peso (g)» dopo «Quantità»); schema di risposta, prompt e validazione (un peso non valido si scarta e il piatto resta); campo «Peso (g)» in Manuale; peso nei preferiti con la regola dei doppioni; provider finto con pesi.
- T7.1: motore `src/engine/portion.ts` (`scaleNutrients`, `weightRatio`, `roundHalfUp`; casi AT e AU), logica della scheda in `src/app/lib/portion-scale.ts` e `use-dish-form.ts`; riga «Porzioni».
- T7.2: `favoriteDishFromQuantity` nel motore (casi AN-AS); `favorites` nello schema e nella validazione (pasto con soli preferiti ammesso); `buildModelText` (solo nome e riferimento al modello); campo modificabile con etichette (`favorite-text-field.tsx`) ed elenco (`favorite-picker.tsx`); piatti «dai tuoi preferiti» senza controllo di coerenza; correzione con riferimenti e ricalcolo; riferimento sconosciuto scartato con avviso; provider finto `demoEstimate`.

**Test.** 62 file, 964 test passati (`npm test`); `npm run lint` e `npm run build` puliti; `npm run prova-comandi` (99 controlli, tra cui le etichette: un solo tasto indietro, due etichette, nessun numero del preferito verso il modello) e `npm run prova-scorrimento` (20) passano. Nel motore solo aggiunte (`portion.ts` e il suo test): nessun caso da A ad AM e nessun test preesistente cambiato. Alcuni test esistenti di `src/data`, `src/app/lib` e `tools/setup-sql.test.ts` sono stati aggiornati per i nuovi campi (`weightG: null`, intestazione del CSV, limite dell'aggiornamento 5c alla migrazione 15). 267 scenari e screenshot scuri a 390 px in `docs/screenshots/`.

**SQL.** `supabase/migrations/20260101000016_peso_piatto.sql`; `supabase/aggiornamento-fase-7.sql` e `supabase/setup.sql` rigenerati con `npm run setup-sql` (un test ne controlla l'aggiornamento e che contengano solo aggiunte).

**Decisioni da confermare** (dettaglio in `docs/DIARIO.md`): un peso non valido nella risposta del modello si scarta e il piatto resta valido; in un piatto nuovo scrivere un peso a mano non ricalcola (la modalità «Peso» o «Porzioni» si decide all'apertura); l'elenco per le etichette mostra solo i piatti preferiti; senza quantità detta il piatto da etichetta usa la quantità salvata nel preferito ed è «ipotizzato»; nel caso AS la quantità scritta è «1 porzione»; un preferito eliminato dopo averlo messo nella frase si calcola comunque; il testo originale salvato ha il nome del preferito al posto dell'etichetta.

**Limiti e cose non verificate.**
- Il comportamento del **modello vero** con le etichette (riferimento, pasto giusto, grammi e porzioni, nessuna stima del preferito, aggiornamento in correzione) non è verificato: prompt e schema sono provati solo con test sul testo e con il provider finto.
- Il campo con le etichette (campo modificabile con tessere non modificabili, un solo tasto indietro, dettatura) è provato con Chromium e tastiera simulata, **non su un iPhone vero**; così pure l'incolla di testo.
- La migrazione 16 è provata solo a livello di testo e con il database finto, non su Supabase vero (vedi «Non verificato» nel diario).
