# Task

Stati: `da fare`, `fatto`, `bloccato`. I riferimenti (§) rimandano a `docs/BRIEF.md`.

## Fase 1: motore dei calcoli e schema del database

Nessuna schermata in questa fase. Alla fine il motore è completo, testato e non dipende da nient'altro.

### T1.0 Impalcatura del progetto · fatto
Crea il progetto con lo stack e la struttura di cartelle di `CLAUDE.md`.
- `npm run lint`, `npm test` e `npm run build` passano su un progetto vuoto.
- Esistono `docs/DIARIO.md` (con le sezioni "Decisioni da confermare" e "Non verificato") e `.claude/agents/revisore.md` con i controlli elencati in `CLAUDE.md`.
- Una regola di lint impedisce a `src/engine` di importare da fuori `src/engine`.
- La pagina iniziale mostra solo il nome dell'app.

### T1.1 Tipi e impostazioni · fatto
In `src/engine`: tipi per pasto, giorno, attività, impostazioni; `defaults.ts` con i valori di §3.
- I default coincidono uno per uno con la tabella di §3.
- Una funzione unisce impostazioni parziali dell'utente ai default; i valori mancanti o non validi (negativi, non numerici) tornano al default.
- Test su entrambi i comportamenti.

### T1.2 Kcal contate nel budget · fatto
Funzione per §3.1.
- Pasto libero sopra il tetto conta il tetto; sotto il tetto conta il suo valore.
- Le kcal reali del giorno restano disponibili separatamente.
- Funzione che dice se nella settimana è già stato usato un pasto libero, con possibilità di escludere un pasto (serve in modifica).
- Giorno senza pasti: 0.

### T1.3 Bonus attività · fatto
Funzione per §3.2.
- Usa le kcal di Salute se presenti, altrimenti km × kcal per km.
- Passi sotto la soglia: bonus 0.
- Casi E e F di §3.6 per la parte di bonus.

### T1.4 Obiettivo del giorno · fatto
Funzione per §3.3. Riceve la data, i giorni della settimana e le impostazioni; restituisce base, recupero, bonus bici, bonus passi e totale.
- Settimana da lunedì a domenica, calcolata senza dipendere dal fuso orario della macchina.
- Casi A, B, C, D, H di §3.6 con i numeri esatti.
- Il lunedì il recupero è sempre 0.
- Un saldo positivo non aumenta mai l'obiettivo.
- La base non scende mai sotto la soglia minima; il bonus si somma sopra.

### T1.5 Obiettivi dei nutrienti · fatto
Funzione per §3.4.
- Casi E, F, G di §3.6 per i carboidrati.
- Valori manuali di proteine e grassi sostituiscono la formula.
- I carboidrati non sono mai negativi.

### T1.6 Semafori · fatto
Funzione per §3.5, una per tipo (minimo, intervallo, tetto) più quella dell'anello kcal.
- Casi I e J di §3.6.
- Test sui valori esattamente al confine di ogni soglia.
- Obiettivo pari a 0: nessun errore, stato neutro.

### T1.7 Riepilogo della settimana · fatto
Funzione che restituisce, per una settimana: kcal e obiettivo di ogni giorno, saldo, media kcal, medie dei nutrienti, km totali, passi medi, pasto libero usato, giorni di sfida completati.
- Le medie considerano solo i giorni con almeno un pasto; i passi medi solo i giorni con passi.
- Settimana vuota: nessun errore, valori assenti e non zero.

### T1.8 Piano della sfida · fatto
Funzione pura per §6: dato il piano, la data di inizio e una data, restituisce numero del giorno ed esercizi con ripetizioni.
- Giorno 1: push up 1, crunch 20, crunch incrociati 10 per lato.
- Giorno 4: push up 4, crunch 20, crunch incrociati 10, dead bug 10.
- Giorno 6: crunch 30.
- Giorno 30: 12 esercizi.
- Prima dell'inizio e dopo il giorno 30: nessun esercizio, con stato distinto ("non iniziata", "completata").
- Il piano è un dato in ingresso, non è scritto dentro la funzione.

### T1.9 Schema del database · fatto
Migrazioni SQL in `supabase/migrations` per le tabelle di §7.
- Ogni tabella ha il riferimento all'utente e regole di sicurezza per riga: un utente legge e scrive solo le proprie righe.
- Attività giornaliera: una riga per utente e data, con fonte distinta per passi e bici.
- Pasti: includono fibre, sale, pasto libero e testo originale dettato.
- Piano della sfida ed esercizi come tabelle separate; il piano di 30 giorni è inserito come dato iniziale.
- Un file `docs/SCHEMA.md` descrive ogni tabella in una riga.
- Le migrazioni non sono state applicate a un database reale: scrivilo in "Non verificato", a meno che l'ambiente permetta di provarle in locale.

### T1.10 Report di fase · fatto
Scrivi `docs/REPORT-FASE-1.md` come indicato in `CLAUDE.md` e fermati.

## Fase 2: schermate con dati salvati nel browser

Obiettivo: un'app che Mauro può aprire sull'iPhone e usare davvero, con inserimento manuale. I dati restano nel browser finché non si collega Supabase; le schermate non sanno dove sono salvati. Niente AI (fase 3), niente ingressi per i Comandi rapidi (fase 4), niente grafici (fase 5).

Regole valide per tutti i task con schermate:
- Le schermate leggono e scrivono solo attraverso `src/data` (T2.0) e calcolano solo attraverso `src/engine`. Nessuna formula o costante di regola nei componenti.
- Ogni schermata ha uno scenario di dati di esempio in `tests/fixtures/` e i suoi screenshot in `docs/screenshots/` (390×844, tema chiaro e scuro), generati con `npm run screens`. Il revisore li apre e li guarda.
- Numeri in formato italiano (1.994 kcal, 4,8 g). Aree toccabili di almeno 44 px. Nessuno scorrimento orizzontale.
- Stati vuoti curati: un giorno senza pasti, una settimana vuota e un profilo senza peso devono avere una schermata sensata, non zeri o errori.
- Se Playwright non riesce a installare il browser nell'ambiente, scrivilo in "Non verificato" e prosegui; non dichiarare verificato ciò che non hai visto.

### T2.0 Sportello dei dati · fatto
In `src/data`: un'interfaccia unica (`DataStore`) per leggere e scrivere impostazioni, pasti, attività del giorno, pesate e registro della sfida, con due implementazioni: in memoria (per i test) e nel browser (`localStorage`).
- Le schermate useranno solo questa interfaccia; nessun altro file tocca `localStorage`.
- I dati salvati hanno un numero di versione del formato, per poterli migrare in futuro.
- Dati illeggibili o di una versione sconosciuta non bloccano l'app: si riparte vuoti e lo si segnala con un messaggio.
- I campi ricalcano le tabelle di `docs/SCHEMA.md`, così il passaggio a Supabase cambierà solo l'implementazione.
- Test sull'implementazione in memoria e su quella del browser (con un `localStorage` finto): scrittura, lettura, modifica, eliminazione, dati corrotti.

### T2.1 Guscio dell'app · fatto
Struttura comune a tutte le schermate.
- Barra in basso con Oggi, Settimana, Grafici, Impostazioni. Grafici mostra solo "In arrivo".
- Colori come variabili CSS, tema chiaro e scuro automatici; font di sistema; titoli grandi; schede arrotondate; un solo colore d'accento più verde, giallo e rosso dei semafori.
- Rispetto delle aree sicure dell'iPhone (notch e barra home).
- Installabile sulla Home dell'iPhone: manifest, icona semplice, apertura a schermo intero, nome "Personal Health".
- Componente "pannello dal basso" riutilizzabile, chiudibile con trascinamento o tasto.
- Script `npm run screens` che genera gli screenshot da scenari in `tests/fixtures/`.

### T2.2 Oggi: anello e nutrienti · fatto
Parte alta della schermata Oggi (§2 del brief, punti 1-3).
- Data con frecce e tasto "Oggi"; titolo "Oggi" o giorno della settimana con data.
- Anello delle kcal con le kcal rimaste al centro (o "sopra di" se si è sforato), colore secondo §3.5.
- Riga di composizione dell'obiettivo, con le sole voci diverse da zero.
- Griglia delle cinque schede nutrienti: nome, "assunto su obiettivo", barretta a semaforo.
- Peso per le proteine: ultima pesata se presente, altrimenti peso del profilo. Senza nessuno dei due, la scheda proteine invita a inserire il peso.
- Scenari: giorno vuoto, giorno normale, caso B del brief (giovedì con recupero), giorno di bici (caso E).

### T2.3 Pasti · fatto
Lista dei pasti e pannello Aggiungi con inserimento manuale.
- Pasti raggruppati per fascia; per ciascuno nome, kcal, macro ed etichetta "libero".
- Pulsante + sempre visibile che apre il pannello Aggiungi.
- Inserimento manuale: nome, fascia, kcal, proteine, carboidrati, grassi, fibre, sale. Solo kcal obbligatorie.
- Interruttore "Pasto libero" disattivato, con spiegazione, se la settimana ne ha già uno.
- Modifica ed eliminazione di un pasto, con conferma prima di eliminare.
- "Copia da ieri": copia i pasti del giorno prima come pasti normali (mai liberi); se ieri non ci sono pasti, lo dice.
- Nel pannello, al posto del microfono, uno spazio riservato con la scritta "Inserimento a voce: in arrivo".

### T2.4 Attività e pesata · fatto
- Sezione Attività in Oggi: passi e bici (km, kcal), con fonte "manuale".
- Dal pannello Aggiungi: "Attività a mano" (passi, km, kcal facoltative) e "Pesata" (kg, una per giorno; una seconda pesata nello stesso giorno sostituisce la prima).
- L'obiettivo del giorno si aggiorna subito dopo il salvataggio.

### T2.5 Sfida mattutina · fatto
Sezione in Oggi, usando `challengeDay` del motore e il piano di 30 giorni.
- Esercizi del giorno con spunta "fatto", ripetizioni modificabili, "Salta"; indicazione "per lato" ed etichetta "nuovo" il giorno in cui un esercizio entra.
- Intestazione "Giorno N/30 · fatti X su Y".
- Prima dell'inizio e dopo il giorno 30: messaggio dedicato, nessuna lista.
- Nota fissa in fondo: "Fermati se senti dolore a inguine o pube e salta l'esercizio."

### T2.6 Settimana · fatto
Schermata Settimana (§2 del brief), usando `weekSummary`.
- Sette barre delle kcal mangiate con la linea dell'obiettivo di ogni giorno; colore secondo l'anello kcal.
- Frecce per cambiare settimana.
- Saldo, media kcal, medie dei nutrienti, km, passi medi, pasto libero usato, giorni di sfida.
- Toccare una barra apre quel giorno in Oggi.
- Scenari: settimana vuota, settimana parziale, settimana completa con uno sforamento.

### T2.7 Impostazioni · fatto
- Profilo: peso, altezza, età, peso obiettivo.
- Obiettivi: kcal base e soglia minima; grammi di proteine e grassi con il valore proposto dalla formula visibile e la possibilità di sostituirlo o tornare alla formula; fibre, sale, margine dei semafori.
- Attività: kcal per km, kcal per passo, soglia passi, quota di bonus. Pasto libero: tetto di kcal.
- Sfida: data di inizio.
- "Ripristina valori predefiniti", con conferma.
- Valori non validi rifiutati con un messaggio accanto al campo; mai salvati.
- Ogni sezione ha una riga che spiega in parole semplici a cosa serve.

### T2.8 Rifinitura grafica · fatto
Passaggio finale su tutte le schermate, solo correttivo: nessuna funzione nuova.
- Rigenera tutti gli screenshot e controllali uno per uno: allineamenti, spaziature coerenti, testi tagliati, contrasto in tema scuro, aree toccabili.
- Prova anche a 375 px e 430 px di larghezza, oltre a 390.
- Correggi ciò che trovi e annota nel diario cosa è stato cambiato.

### T2.9 Report di fase · fatto
Scrivi `docs/REPORT-FASE-2.md` come indicato in `CLAUDE.md` e fermati. Nella parte in parole semplici, includi una lista di 10 controlli che Mauro può fare in cinque minuti sul telefono.

## Fase 3: dati online con Supabase, pasti composti da piatti

Obiettivo: i dati di Mauro stanno online, uguali su iPhone e Mac, e nulla di quanto già inserito nel browser va perso. In più, i pasti diventano contenitori di piatti e le proteine si calcolano sul peso obiettivo.

Vincoli di questa fase:
- Nessuna chiave reale. Supabase si collega con due variabili d'ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) che inserirà Mauro su Vercel. **Senza queste variabili l'app continua a funzionare esattamente come oggi, con i dati nel browser.** Questo è un requisito, non un ripiego.
- Le schermate non cambiano per il passaggio a Supabase: cambia solo cosa c'è dietro `src/data`.
- I test del motore che riguardano il pasto libero possono essere aggiornati in T3.0, perché la regola cambia; vanno aggiornati solo quelli, e il diario dice quali.
- Per le schermate valgono le regole della fase 2 (scenari, screenshot, formato italiano, stati vuoti).

### T3.0 Motore: pasto libero sul pasto intero · fatto
§3.1 del brief: il pasto libero vale per l'insieme dei piatti di una fascia in un giorno.
- Un pasto è libero se è segnato libero; il tetto `freeMealCap` si applica alla somma dei suoi piatti, non al singolo piatto.
- Caso L di §3.6; caso C ancora valido.
- "Pasto libero già usato nella settimana" ragiona sui pasti, non sui piatti, e può escludere un pasto (serve in modifica).
- Nel database, la scelta più semplice che non rinomina né elimina colonne (per esempio il segno libero su tutti i piatti del pasto, oppure una tabella nuova per i pasti); scrivi la scelta nel diario.

### T3.1 Motore: proteine sul peso obiettivo · fatto
§3.4 del brief.
- Nuova impostazione `proteinPerKgTarget` (1,8) con default in `defaults.ts`.
- Con peso obiettivo impostato: `proteinPerKgTarget × peso obiettivo`; senza: `proteinPerKg × peso`. Il valore manuale sostituisce sempre la formula.
- Caso K di §3.6; caso con solo peso attuale (100 kg → 140 g) ancora valido.

### T3.2 Schermate: pasti composti da piatti · fatto
- In Oggi ogni pasto è una scheda con totale di kcal e macro e i piatti elencati sotto; un pasto vuoto non compare, salvo un invito discreto ad aggiungere.
- "Aggiungi piatto" dentro ogni pasto, con la fascia già scelta; il + generale chiede la fascia.
- Il pannello del piatto contiene nome, quantità facoltativa (testo libero, es. "100 g"), kcal e macro. In questa fase kcal resta obbligatorio; la stima dei numeri mancanti arriverà con l'AI.
- Interruttore "Pasto libero" sul pasto intero, con la stessa logica di blocco settimanale.
- "Copia da ieri" copia tutti i piatti, mai liberi. Modifica ed eliminazione per singolo piatto.
- In Impostazioni la scheda Proteine spiega su quale peso è calcolata ("1,8 g per kg del peso obiettivo").
- Scenari: pasto con un piatto, pasto con tre piatti, pasto libero con più piatti, giornata con tutti e quattro i pasti.

### T3.3 Sportello dati su Supabase · fatto
- Implementazione di `DataStore` su Supabase, con `@supabase/supabase-js` (motivo della dipendenza nel diario).
- L'app sceglie Supabase solo se entrambe le variabili d'ambiente sono presenti; altrimenti usa il browser.
- Migrazioni aggiornate per T3.0 e T3.1, solo per aggiunta. Un file unico `supabase/setup.sql` con tutto lo schema in ordine, da incollare nell'editor SQL di Supabase.
- Errori di rete: messaggio chiaro, nessun dato perso in silenzio; un salvataggio fallito resta visibile e si può riprovare.
- Test con un client Supabase finto. Ciò che non si può provare senza Supabase vero va in "Non verificato".

### T3.4 Accesso con email e codice · fatto
Solo quando Supabase è configurato.
- Schermata "Accedi": email, poi codice di 6 cifre ricevuto per email. Niente link magico (vedi §7 del brief).
- La sessione resta attiva: si accede una volta per dispositivo.
- "Esci" in Impostazioni, con l'email dell'account visibile.
- Senza Supabase configurato, nessuna schermata di accesso.

### T3.5 Importazione dei dati del browser · fatto
- Al primo accesso, se il browser contiene dati, l'app propone "Importa i dati di questo dispositivo" mostrando quanti giorni, piatti e pesate contiene.
- L'importazione non crea doppioni se ripetuta (anche da un secondo dispositivo con dati diversi: si uniscono).
- I dati del browser restano finché l'utente non conferma che l'importazione è andata a buon fine.
- I pasti salvati prima di T3.0 (un piatto per voce) vengono importati come pasti di un solo piatto.

### T3.6 Esportazione dei dati · fatto
Impostazioni → Dati → "Esporta": un file CSV dei piatti (data, pasto, nome, kcal, macro, fibre, sale, libero) e uno delle pesate e attività. Funziona sia con il browser sia con Supabase.

### T3.7 Guida al collegamento · fatto
`docs/COLLEGA-SUPABASE.md`: passi numerati per chi non sa programmare, uno per volta, ciascuno con cosa si vede a schermo:
creare il progetto su Supabase, incollare `supabase/setup.sql`, attivare l'accesso con codice via email (modello dell'email con il codice), copiare URL e chiave pubblica, inserirle su Vercel, ripubblicare, accedere e importare.

### T3.8 Report di fase · fatto
Scrivi `docs/REPORT-FASE-3.md` come indicato in `CLAUDE.md` e fermati. Nella parte in parole semplici, includi i controlli da fare sul telefono prima e dopo il collegamento di Supabase.

## Fase 4: inserimento con l'AI, preferiti, pulizia

Obiettivo: segnare un pasto scrivendo o dettando una frase, con la stima fatta da Gemini su Vertex AI; riusare piatti e pasti salvati senza AI; togliere la sfida; accogliere un secondo utente con un primo avvio guidato. Regole del brief in §4.

Vincoli di questa fase:
- Nessuna chiave reale. Vertex si collega con variabili d'ambiente **solo lato server** (mai `NEXT_PUBLIC_`): progetto, regione, modello e credenziali dell'account di servizio. Senza queste variabili l'app funziona come oggi: il campo AI mostra "Stima automatica non disponibile" e resta l'inserimento con i numeri.
- In sviluppo e nei test si usa il provider finto. Nessuna chiamata di rete reale nei test.
- Gli accessi si gestiscono da Supabase: nessuna schermata di inviti.
- Per le schermate valgono le regole della fase 2 (scenari, screenshot, formato italiano, stati vuoti).

### T4.0 Rimozione della sfida mattutina · fatto
- Spariscono la sezione in Oggi, i giorni di sfida in Settimana, la data di inizio in Impostazioni e il codice del motore e dei moduli dedicato alla sfida, con i suoi test.
- Le tabelle della sfida restano nel database (nessuna migrazione che le elimina).
- I test e gli screenshot esistenti vengono aggiornati di conseguenza; il diario elenca cosa è stato tolto.

### T4.1 Provider AI e stima lato server · fatto
- In `src/modules/ai`: interfaccia `AiProvider` con un'unica operazione "stima pasti da testo", implementazione Vertex AI (Gemini) e implementazione finta.
- Una route del server riceve testo, data e ora locali ed eventuale stima precedente con correzione; richiede un utente con accesso; chiama il provider; restituisce la proposta.
- Al modello va solo ciò che §4 consente. Il prompt è in un file a parte, in italiano, e chiede risposta in JSON con uno schema fisso.
- La risposta del modello viene validata: valori numerici non negativi, fasce ammesse, almeno un piatto. Se non è valida, errore chiaro e nessun salvataggio.
- Limite di 60 stime al giorno per utente, contate nel database (nuova tabella, per aggiunta). Oltre il limite: messaggio chiaro.
- Test con il provider finto su almeno 10 frasi tipiche in `tests/fixtures/ai/`: un piatto; più piatti nello stesso pasto ("anelli di totano e un'insalata di pomodorini" → due piatti); due pasti nella stessa frase ("a colazione… e a pranzo…"); fascia detta; fascia dedotta dall'ora; quantità dette; quantità mancanti (ipotizzate e segnate come tali); correzione; risposta non valida; limite superato.

### T4.2 Schermata di inserimento con l'AI · fatto
- In cima al pannello Aggiungi: campo "Cosa hai mangiato?" con suggerimento "Puoi dettare con il microfono della tastiera", e pulsante "Stima".
- Proposta raggruppata per pasto, con i piatti: nome, quantità (con etichetta "ipotizzata" se lo è), kcal e macro, tutti modificabili; fascia del pasto modificabile; un piatto si può togliere.
- Campo "Correggi" per una correzione a parole, che rifà la stima partendo dalla precedente.
- "Conferma" salva tutti i piatti nei pasti indicati del giorno visualizzato; "Annulla" non salva nulla.
- Stato di caricamento, errori di rete, limite superato e AI non configurata: messaggi chiari, il testo scritto non si perde.

### T4.3 Piatto a mano con stima · fatto
- Il pannello del piatto a mano chiede nome e quantità; kcal e macro diventano facoltativi.
- Se kcal sono vuote: pulsante "Stima con AI" che riempie i numeri dal nome e dalla quantità, da confermare. Senza AI configurata, kcal resta obbligatorio come oggi.

### T4.4 Preferiti · fatto
- Toccando un piatto: "Salva nei preferiti". Toccando l'intestazione di un pasto: "Salva pasto" (tutti i suoi piatti, con un nome modificabile).
- Nel pannello Aggiungi, sezione "Preferiti" con piatti e pasti salvati, cercabili per nome; un tocco li aggiunge al giorno visualizzato, nella fascia scelta, senza AI.
- Eliminazione di un preferito. Nuova tabella per i pasti preferiti, per aggiunta; i preferiti di piatti usano la tabella esistente.
- Funziona sia con i dati nel browser sia con Supabase.

### T4.5 Primo avvio guidato · fatto
- Al primo accesso di un utente senza impostazioni salvate: tre schermate brevi con peso, peso obiettivo e kcal base, precompilate con i valori predefiniti, più "Salta".
- Alla fine si arriva in Oggi. Le stesse voci restano modificabili in Impostazioni.
- In Impostazioni, sezione "Collegamenti": stato dell'AI ("attiva" o "non configurata").

### T4.6 Guida al collegamento di Vertex AI · fatto
`docs/COLLEGA-VERTEX.md`, stesso stile della guida di Supabase, passi numerati con cosa si vede a schermo:
attivare l'API di Vertex AI nel progetto Google Cloud, creare un account di servizio con il ruolo minimo necessario per chiamare i modelli, scaricare la chiave JSON, scegliere regione europea e modello verificandone la disponibilità, impostare un avviso di budget, inserire le variabili su Vercel (solo lato server), ripubblicare, provare una stima.
La guida avverte che i nomi dei pulsanti possono essere cambiati e che la chiave JSON non va mai incollata in chat né nel repository.

### T4.7 Report di fase · fatto
Scrivi `docs/REPORT-FASE-4.md` come indicato in `CLAUDE.md` e fermati. Nella parte in parole semplici, includi i controlli da fare sul telefono prima e dopo il collegamento di Vertex.

## Fase 4b: ritocchi delle schermate

Obiettivo: schermate più essenziali dopo il primo uso reale. Meno testo, meno voci, l'AI come via principale. Regole del brief in §4 (pannello Aggiungi, Settimana).

Vincoli di questa fase:
- Nessuna modifica al motore dei calcoli, salvo dove indicato; nessuna nuova tabella o colonna.
- Per ogni task si aggiornano gli scenari degli screenshot (390 px, tema chiaro e scuro): niente testo tagliato, sovrapposizioni o scorrimento orizzontale.
- Nessun testo d'esempio nei campi ("es. …", "Facoltativo").

### T4b.1 Pannello Aggiungi: AI | Manuale · fatto
- Accanto al titolo del pannello un selettore "AI | Manuale". Si apre sempre su AI.
- AI: campo "Cosa hai mangiato?" vuoto, senza testo d'esempio e senza la frase sul microfono; pulsante "Stima". Se l'AI non è configurata, l'avviso invita a usare "Manuale".
- Manuale: i campi del piatto a mano, con "Stima con AI" quando i numeri sono vuoti (come oggi).
- Spariscono le voci "Piatto a mano" (sostituita dal selettore) e "Copia da ieri", con il codice e i test che non servono più.
- Sotto restano "Preferiti", "Attività a mano", "Pesata", senza le righe grigie di spiegazione.
- "+ Aggiungi piatto" sotto un pasto apre lo stesso pannello, su AI, con il nome della fascia come titolo e la fascia fissata: tutti i piatti proposti dall'AI vanno in quella fascia, anche se il modello ne indica un'altra. Sotto compare solo "Preferiti".
- Test della logica che porta i piatti proposti nella fascia fissata.

### T4b.2 Proposta della stima a righe compatte · fatto
- Ogni piatto della proposta è una riga: nome, quantità (con "ipotizzata" se lo è), kcal.
- Toccando la riga si aprono nome, quantità, nota del modello, kcal e nutrienti modificabili, e "Togli". Un piatto con un errore si apre da solo e la riga lo segnala.
- Sparisce la frase iniziale "Controlla la stima…". Restano "Correggi", "Rifai la stima", "Conferma", "Annulla".

### T4b.3 Preferiti: + e Modifica · fatto
- Ogni riga mostra a destra un + ben visibile: toccando la riga il preferito si aggiunge.
- "Elimina" non compare più nella lista. Un pulsante "Modifica" accanto al campo di ricerca mostra "Elimina" (con conferma) su ogni riga e nasconde i +; "Fine" torna alla lista normale.
- Il campo di ricerca non ha più l'etichetta "Cerca" sopra (resta come testo nel campo). Sparisce la nota "Senza quantità".
- Se la fascia è già fissata (dal pasto), la scelta della fascia non compare.

### T4b.4 Oggi: testi ripuliti · fatto
- Sotto l'anello, la riga di composizione compare solo se oltre alla base ci sono bici, passi o recupero.
- "kcal sopra di" diventa "kcal oltre".
- Attività vuota: solo "Nessuna attività".

### T4b.5 Peso nella Settimana · da fare
- Nuova scheda "Peso": ultima pesata della settimana e differenza in kg (una cifra decimale) con l'ultima pesata precedente al lunedì; se non ce n'è, con il peso del profilo, che è il peso di partenza e non viene mai sovrascritto dalle pesate.
- Colore della differenza: verde se ci si avvicina al peso obiettivo, rosso se ci si allontana (vale anche quando l'obiettivo è salire), grigio senza peso obiettivo o senza variazione.
- La scheda non compare se nella settimana non ci sono pesate.
- La logica è una funzione pura con test: nessuna pesata nella settimana; confronto con la pesata precedente; confronto con il peso di partenza; obiettivo sotto e sopra; nessun obiettivo; variazione zero; pesate non ordinate.

### T4b.6 Report di fase · da fare
Scrivi `docs/REPORT-FASE-4b.md` come indicato in `CLAUDE.md` e fermati. Nella parte in parole semplici, elenca cosa provare sul telefono dopo la pubblicazione.
