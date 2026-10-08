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

### T4b.5 Peso nella Settimana · fatto
- Nuova scheda "Peso": ultima pesata della settimana e differenza in kg (una cifra decimale) con l'ultima pesata precedente al lunedì; se non ce n'è, con il peso del profilo, che è il peso di partenza e non viene mai sovrascritto dalle pesate.
- Colore della differenza: verde se ci si avvicina al peso obiettivo, rosso se ci si allontana (vale anche quando l'obiettivo è salire), grigio senza peso obiettivo o senza variazione.
- La scheda non compare se nella settimana non ci sono pesate.
- La logica è una funzione pura con test: nessuna pesata nella settimana; confronto con la pesata precedente; confronto con il peso di partenza; obiettivo sotto e sopra; nessun obiettivo; variazione zero; pesate non ordinate.

### T4b.6 Report di fase · fatto
Scrivi `docs/REPORT-FASE-4b.md` come indicato in `CLAUDE.md` e fermati. Nella parte in parole semplici, elenca cosa provare sul telefono dopo la pubblicazione.

## Fase 5: dati da Salute, nuova regola del recupero, schede della Settimana

Obiettivo: passi e km in bici arrivano da soli dall'iPhone; lo sgarro si recupera con correzioni piccole; dalla Settimana si gestiscono pesate, attività a mano e pasto libero. Regole del brief in §2, §3.3, §3.6 e §5.

I task sono in ordine di valore: si eseguono in quest'ordine.

Vincoli di questa fase:
- Nessuna chiave reale e nessuna chiamata di rete reale nei test: Supabase resta simulato.
- Nessun nuovo segreto da configurare su Vercel, se si può evitare: l'ingresso riconosce l'utente dal codice personale tramite una funzione del database (come il contatore delle stime AI). Se serve davvero una nuova variabile, il motivo va nel diario e il passo nella guida.
- Il database cresce per aggiunte. Le istruzioni SQL da eseguire a mano su Supabase stanno in `supabase/aggiornamento-fase-5.sql`; `supabase/setup.sql` va rigenerato.
- Per le schermate valgono le regole della fase 2 e della 4b (scenari, screenshot a 390 px in chiaro e scuro, formato italiano, stati vuoti, nessun testo d'esempio nei campi).
- Nessuna funzione oltre a quelle elencate. In particolare: niente email, niente velocità media, niente obiettivo del giorno modificabile a mano (§9).

### T5.0 Ingresso dei dati da Salute · fatto
- Route del server `POST /api/ingest/health`. Il codice personale arriva nell'intestazione `Authorization: Bearer …`. Codice assente, sbagliato o revocato: 401, senza dire quale dei tre.
- Corpo JSON con due campi facoltativi, `passi` e `bici_km`. Ciascuno è un testo con una riga per giorno, `data;valore` (per esempio `2026-10-08;8123`), oppure un elenco di oggetti `{ "data": "2026-10-08", "valore": 8123 }`. Il testo è scritto a mano dentro un Comando rapido, quindi la lettura deve essere tollerante:
  - separatore `;`, `,` seguito da spazio, tabulazione o più spazi; righe vuote ignorate;
  - data `aaaa-MM-gg`; accettata anche `gg/MM/aaaa`;
  - passi: numero intero; `8.123` e `8 123` valgono 8123; `8123,0` e `8123.0` valgono 8123; un'unità dopo il numero ("conteggio", "passi") si ignora;
  - km: decimale con virgola o punto (`12,4`, `12.4`, `1.234` = 1,234 km); un'unità dopo il numero ("km") si ignora; arrotondato a due decimali.
- Si tengono solo le righe di oggi e di ieri nel fuso `Europe/Rome` (costante di configurazione, non scritta nelle schermate). Le altre finiscono tra le scartate.
- Scrittura in `daily_activity`, per utente e data, separata per passi e bici: se il valore esistente ha fonte `manuale` non si tocca; altrimenti si salva con fonte `salute`. Valore mancante, non leggibile, negativo o zero: non scrive e non cancella. Per la bici si salvano solo i km (le kcal le calcola il motore).
- Risposta JSON leggibile anche da una persona, perché verrà guardata dentro il Comando rapido durante la prova: `ok`, righe salvate (data, passi, km), righe lasciate perché inserite a mano, righe scartate con il motivo in italiano.
- Ogni chiamata finisce in `ingest_log` con esito e dettaglio breve. Limite di 200 chiamate al giorno per utente; oltre: 429 con messaggio chiaro.
- Test: codice valido, sbagliato, revocato; tutti i formati elencati sopra; riga di tre giorni fa scartata; valore manuale non sovrascritto; invio ripetuto senza doppioni; valore aggiornato dal secondo invio; solo passi; solo bici; corpo vuoto o non JSON (400); limite superato; due utenti che non si vedono.

### T5.1 Codice personale, stato e avviso · fatto
- Impostazioni → Collegamenti, voce "Salute": senza codice, pulsante "Crea codice"; il codice compare una sola volta con "Copia" e l'indirizzo dell'ingresso da copiare. Con un codice già creato: "Rigenera" (con conferma, perché il Comando rapido smette di funzionare finché non si aggiorna) e "Disattiva".
- Sotto: ultimo invio riuscito (data e ora) e i valori ricevuti per oggi e ieri; se l'ultimo tentativo è fallito, il motivo.
- Senza accesso a Supabase (dati solo nel browser) la voce spiega in una riga che il collegamento richiede l'accesso.
- Oggi: se esiste un codice attivo e da più di 24 ore non c'è un invio riuscito, un avviso in cima ("Nessun dato da Salute da ieri") che porta a Collegamenti. Senza codice, nessun avviso.
- La scheda Attività di Oggi continua a mostrare la fonte ("da Salute" o "manuale").
- Test della logica dell'avviso (nessun codice; invio 23 ore fa; 25 ore fa; mai arrivato dopo la creazione del codice) e scenari di screenshot per ogni stato.

### T5.2 Guida al Comando rapido · fatto
`docs/COLLEGA-SALUTE.md`, stesso stile delle altre guide, passi numerati con cosa si vede a schermo:
1. eseguire `supabase/aggiornamento-fase-5.sql`;
2. creare il codice in Impostazioni;
3. costruire il Comando rapido: due azioni "Trova campioni di dati sanitari" (tipo Passi; tipo Distanza in bici con unità km), ciascuna con "Data di inizio è negli ultimi 2 giorni" e "Raggruppa per: Giorno"; per ciascuna, un ciclo che scrive una riga `data;valore` con la data in formato `aaaa-MM-gg`; un'azione "Ottieni contenuto dell'URL" in POST con intestazione `Authorization` e corpo JSON con `passi` e `bici_km`; "Mostra risultato" solo durante la prova;
4. provare a mano e leggere la risposta;
5. aggiungere sei orari al giorno con "Esegui immediatamente" e senza notifica;
6. cosa controllare in Impostazioni.
La guida dichiara che i nomi delle azioni non sono stati visti a schermo e possono essere diversi, avverte del doppio conteggio con altre app che scrivono in Salute e spiega che gli invii a telefono bloccato non riescono ed è normale.

### T5.3 Nuova regola del recupero · fatto
- Motore: §3.3 riscritto. Nuove impostazioni `recoveryMaxPerDay` (100), `recoveryMin` (25), `creditCap` (300) in `src/engine/defaults.ts`, salvate come le altre (nuove colonne per aggiunta).
- **Questo task cambia una regola di calcolo: i test del motore si aggiornano ai nuovi valori di §3.6.** Cambiano i casi B, C e D; si aggiungono M, N, O, P, Q, R. Gli altri casi (A, E, F, G, H, I, J, K, L) devono restare identici e i loro test non si toccano.
- Anteprima dei giorni futuri come in §3.3: una funzione pura che riceve qual è "oggi" come parametro (il motore non legge la data). Oggi, Settimana e la linea dell'obiettivo sulle sette barre usano questa funzione per i giorni dopo oggi.
- Il saldo mostrato in Settimana è quello della regola, con il tetto al margine.
- Riga di composizione sotto l'anello: "recupero" compare solo quando il recupero è diverso da zero, quindi mai per debiti sotto `recoveryMin`.
- Impostazioni → Obiettivi: "Recupero massimo al giorno" e "Margine massimo della settimana", con una riga di spiegazione ciascuno. `recoveryMin` non ha un campo.
- Test: tutti i casi di §3.6; debito che si estingue in più giorni; margine che assorbe uno sgarro successivo; giorni senza pasti che non entrano nel saldo; lunedì che azzera; soglia minima con `recoveryMaxPerDay` alto.

### T5.4 Schede della Settimana toccabili · fatto
- **Peso**: la scheda c'è sempre; senza pesate nella settimana dice "Nessuna pesata". Toccandola: pannello con le pesate, dalla più recente, e "Aggiungi pesata". Ogni pesata si elimina.
- **Bici** e **Passi**: toccandole, pannello con i sette giorni della settimana, valore e fonte. Le righe con fonte `manuale` si eliminano; quelle `salute` no. Eliminare un valore a mano lascia il giorno vuoto: il prossimo invio da Salute potrà riempirlo.
- **Pasto libero**: se nella settimana c'è, il pannello mostra giorno, fascia e kcal, con "Togli pasto libero" (il pasto resta e torna normale, cioè conta per intero). Se non c'è, elenco dei pasti della settimana con "Segna come libero".
- Le schede toccabili hanno un segno che lo fa capire (freccia a destra) e un'area di almeno 44 px.
- Dopo ogni modifica, Settimana e Oggi mostrano subito i numeri ricalcolati.
- Test della logica (eliminazione consentita solo per `manuale`; pasto libero tolto e rimesso; pesata eliminata e scheda che torna a "Nessuna pesata") e scenari di screenshot per ogni pannello, pieno e vuoto.

### T5.5 Scorrimento a sinistra per le azioni · fatto
- Un solo componente condiviso per le righe che scorrono. Scorrendo verso **sinistra** compaiono i pulsanti a destra della riga; scorrendo indietro o toccando altrove si richiudono. Nessuna azione sullo scorrimento verso destra.
- Piatti in Oggi: "Preferiti" (salva il piatto nei preferiti) e cestino. Pannelli di T5.4 (pesate, attività a mano): solo cestino.
- Il cestino elimina subito, senza conferma.
- Il tocco sulla riga continua a fare quello che fa oggi: lo scorrimento è una scorciatoia, non l'unica via.
- Una sola riga aperta alla volta. Lo scorrimento verticale della pagina non deve bloccarsi: il gesto parte solo se il movimento è più orizzontale che verticale. Pulsanti di almeno 44 px.
- Nessuna libreria nuova per il gesto, salvo motivo scritto nel diario.
- Ritocco insieme a questo task: "Elimina davvero" con contrasto sufficiente in tema chiaro.
- Test della logica del gesto (soglie, direzione, una riga aperta alla volta) e prova con il tocco simulato di Playwright. Nel diario, sotto "Non verificato": il gesto su un iPhone vero.

### T5.6 Report di fase · fatto
Scrivi `docs/REPORT-FASE-5.md` come indicato in `CLAUDE.md` e fermati. Nella parte in parole semplici: i controlli da fare sul telefono dopo la pubblicazione e, a parte, quelli da fare dopo aver collegato il Comando rapido.

## Fase 5b: ritocchi dopo la prova sul telefono

Obiettivo: sistemare ciò che è emerso usando l'app con i dati veri di Salute. Regole del brief in §2, §3.5, §3.7, §3.8, §4 e §5.

I task sono in ordine di valore: si eseguono in quest'ordine.

Vincoli di questa fase:
- Nessuna chiave reale e nessuna chiamata di rete reale nei test: Supabase e Vertex restano simulati.
- Il database cresce per aggiunte. C'è una sola modifica allo schema (T5b.0), più il nuovo valore di `recoveryMin` (T5b.1); le istruzioni SQL da eseguire a mano su Supabase stanno in `supabase/aggiornamento-fase-5b.sql`; `supabase/setup.sql` va rigenerato. Nessun'altra tabella o colonna nuova.
- Per le schermate valgono le regole delle fasi 2, 4b e 5. Si rigenerano solo gli screenshot degli scenari toccati dal task.
- Nessuna funzione oltre a quelle elencate. In particolare: niente passi a mano, niente più uscite a mano nello stesso giorno, niente soglie dell'anello in Impostazioni, niente tabella di ingredienti (§9).

### T5b.0 Passi in sola lettura, bici a mano che si somma · fatto
- **Passi**: in Oggi la riga dei passi non è toccabile e non apre nessun pannello. Dal pannello Aggiungi sparisce l'inserimento dei passi: la voce diventa "Bici a mano". Nel pannello Passi della Settimana le righe sono in sola lettura; un vecchio valore con fonte `manuale` si può solo eliminare.
- **Ingresso da Salute**: per i passi, l'invio sostituisce anche un valore con fonte `manuale` (la regola "il manuale non si tocca" non vale più per i passi). La risposta dell'ingresso non elenca più i passi tra le righe "lasciate perché inserite a mano".
- **Bici**: `daily_activity` riceve, per aggiunta, le colonne della parte a mano (km e kcal facoltative). I km da Salute restano dove sono e non si modificano né si eliminano dall'app. La migrazione sposta nella parte a mano i valori di bici che oggi hanno fonte `manuale`, senza perdere nulla. Gli invii da Salute scrivono sempre la parte di Salute e non toccano mai quella a mano.
- **Motore**: km del giorno = Salute + a mano; `kcalBici` = `km di Salute × kcalPerKm` + (kcal a mano se presenti, altrimenti `km a mano × kcalPerKm`). I casi E e F di §3.6 restano identici e i loro test non si toccano.
- **Schermate**: in Oggi la bici mostra il totale del giorno e, se ci sono entrambe le parti, il dettaglio ("12,4 km da Salute + 8 km a mano"). Si tocca solo la parte a mano: apre il pannello per modificarla o eliminarla. "Bici a mano" in un giorno che ha già una parte a mano apre quella, da modificare. Nel pannello Bici della Settimana vale lo stesso, con lo scorrimento per eliminare solo sulla parte a mano.
- Lo sportello dei dati (browser e Supabase) e l'esportazione CSV riportano le due parti.
- Test: passi da Salute che sostituiscono un valore a mano; bici solo Salute, solo a mano, entrambe; kcal a mano presenti e assenti; invio da Salute che non tocca la parte a mano; eliminazione della parte a mano che lascia quella di Salute; migrazione dei vecchi valori a mano (su PostgreSQL locale); E e F invariati.

### T5b.1 Colori dell'anello delle kcal · fatto
- Motore: la regola di §3.5 sostituisce quella attuale. `RingColor` guadagna il verde. Costanti `ringGreenBelow`, `ringGreenAbove`, `ringYellowAbove` in `src/engine/defaults.ts`, senza campo in Impostazioni e senza colonna nel database.
- **Questo task cambia una regola di calcolo: i test dell'anello si aggiornano.** Nessun altro test del motore si tocca.
- `recoveryMin` passa da 25 a 50, uguale a `ringGreenAbove`: default in `defaults.ts`, default della colonna e valore delle righe esistenti che hanno ancora 25 (istruzione in `supabase/aggiornamento-fase-5b.sql`). I casi M, N, O, Q e R di §3.6 restano identici; si aggiunge il caso Z di §3.8.
- Il confronto usa le kcal contate nel budget (con il tetto del pasto libero), come il resto dell'obiettivo.
- Le barre della Settimana prendono gli stessi colori, senza altro lavoro.
- Il verde è quello dei semafori già in uso; contrasto sufficiente in chiaro e scuro.
- Test: caso S di §3.8 con tutti e sei i valori di confine; giorno senza pasti; giorno con pasto libero che resta verde grazie al tetto. Scenari di screenshot per i quattro colori.

### T5b.2 Proposta dell'AI: ricetta, regola del crudo, stima stabile · fatto
- `SYSTEM_PROMPT` riscritto secondo §4: nome = solo il nome del piatto; quantità = ingredienti principali con i grammi; grammi di pasta, riso, cereali e legumi secchi intesi a crudo salvo indicazione contraria, con l'interpretazione scritta nella quantità; piatti distinti restano separati. Il prompt contiene due o tre esempi brevi di ingresso e uscita, tra cui "pasta al pomodoro 100 g" (circa 400-450 kcal, quantità "100 g pasta a crudo, 80 g sugo di pomodoro, 5 g olio") e "100 g di pasta cotta al pomodoro" (circa 130-150 kcal).
- Temperatura a 0. Lo schema di risposta resta strutturato.
- Nessuna modifica al database: la quantità resta il campo di testo esistente. La riga compatta della proposta e la riga del piatto in Oggi devono reggere una quantità lunga: va a capo o si tronca con i puntini, senza scorrimento orizzontale e senza coprire le kcal; toccando il piatto si legge per intero.
- Il provider finto restituisce quantità nel nuovo formato, così gli screenshot mostrano il caso reale.
- Test: il prompt contiene le regole e gli esempi; la richiesta a Vertex ha temperatura 0; la validazione accetta quantità lunghe (limite ragionevole, scritto nel diario). Screenshot della proposta e di Oggi con una quantità di tre ingredienti.
- Nel diario, sotto "Non verificato": la qualità delle stime con il modello vero.

### T5b.3 Pasto libero nella proposta dell'AI · fatto
- Lo schema di risposta guadagna, sul pasto, un campo booleano che dice se l'utente lo ha indicato come libero. Il prompt spiega quando metterlo a vero ("pasto libero", "sgarro libero", "è il mio pasto libero") e che in ogni altro caso è falso.
- Nella conferma ogni pasto proposto ha l'interruttore "Pasto libero", lo stesso componente e le stesse regole dell'inserimento a mano: disattivato, con la spiegazione, se la settimana ha già un pasto libero; acceso in partenza se il modello lo ha segnalato e la settimana lo consente; sempre modificabile prima di confermare.
- Se la proposta contiene più pasti, se ne può segnare libero al massimo uno.
- Con la fascia già fissata ("Aggiungi piatto" sotto un pasto esistente) l'interruttore segue lo stato del pasto esistente, come oggi.
- Il tetto di kcal lo applica solo il motore.
- Test: campo vero e falso; settimana con pasto libero già usato; due pasti proposti; fascia fissata. Screenshot della conferma con interruttore acceso, spento e disattivato.

### T5b.4 Controllo di coerenza tra kcal e nutrienti · fatto
- Motore: funzione pura che applica §3.7, con le costanti `kcalCheckShare` e `kcalCheckMin` in `defaults.ts`.
- Si applica ai piatti restituiti dal modello (stima nuova, stima corretta, stima di un piatto a mano). Non si applica ai numeri scritti a mano dall'utente.
- Nella proposta, il piatto segnalato mostra sulla riga un segno e, aperto, una frase breve ("Le kcal sembrano basse rispetto ai nutrienti: controlla i numeri."). Non blocca la conferma e non cambia i numeri. Ritoccando i numeri il controllo si ricalcola.
- Test: casi T, U e V di §3.8; valori esattamente sulle due soglie; numeri a zero. Screenshot della proposta con un piatto segnalato.

### T5b.5 Preferiti eliminabili scorrendo · fatto
- Le righe dei preferiti (piatti e pasti) usano il componente di scorrimento di T5.5: verso sinistra compare il cestino, che elimina subito senza conferma.
- La modalità "Modifica" dei preferiti sparisce: lo scorrimento è l'unico modo di eliminare. Il + e il tocco sulla riga continuano a fare quello che fanno oggi.
- Test della logica di eliminazione per piatti e pasti e prova con il tocco simulato di Playwright. Screenshot con una riga aperta.

### T5b.6 Media della settimana sul grafico · fatto
- Motore: la media kcal della settimana segue §3.8. La funzione riceve qual è "oggi" come parametro (il motore non legge la data). **I test esistenti della media si aggiornano alla nuova regola**; nessun altro test del motore si tocca.
- La scheda "Media kcal" usa il nuovo numero, con la dicitura "sui giorni conclusi".
- Sul grafico a sette barre: linea tratteggiata orizzontale alla media, con etichetta "media 2.040" che non copre le barre né l'etichetta dell'obiettivo. Colore neutro, diverso dalla linea dell'obiettivo. Senza media la linea non compare.
- Test: casi W, X e Y di §3.8. Screenshot in chiaro e scuro: media sopra l'obiettivo, sotto, molto vicina (le due etichette non si sovrappongono), assente.

### T5b.7 Segno della variazione di peso · fatto
- Ovunque si mostri la variazione di peso: sempre segno e un decimale, con il meno tipografico ("−0,4 kg", "+0,3 kg"). Solo una differenza che arrotondata vale 0,0 si scrive "0,0 kg", in grigio.
- Il colore resta quello già in uso (verde se ci si avvicina al peso obiettivo, rosso se ci si allontana, grigio senza peso obiettivo o a pari distanza): va solo controllato che valga anche per chi vuole aumentare di peso.
- Test: −0,04 → "0,0 kg"; −0,4; −1,2; +0,3; obiettivo più alto del peso attuale con variazione positiva (verde) e negativa (rossa).

### T5b.8 Report di fase · da fare
Scrivi `docs/REPORT-FASE-5b.md` come indicato in `CLAUDE.md` e fermati. Nella parte in parole semplici: l'istruzione SQL da eseguire su Supabase prima del merge e l'elenco dei controlli da fare sul telefono, uno per task.
