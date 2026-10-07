# Task

Stati: `da fare`, `fatto`, `bloccato`. I riferimenti (§) rimandano a `docs/BRIEF.md`.

## Fase 1: motore dei calcoli e schema del database

Nessuna schermata in questa fase. Alla fine il motore è completo, testato e non dipende da nient'altro.

### T1.0 Impalcatura del progetto · bloccato
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

### T1.8 Piano della sfida · da fare
Funzione pura per §6: dato il piano, la data di inizio e una data, restituisce numero del giorno ed esercizi con ripetizioni.
- Giorno 1: push up 1, crunch 20, crunch incrociati 10 per lato.
- Giorno 4: push up 4, crunch 20, crunch incrociati 10, dead bug 10.
- Giorno 6: crunch 30.
- Giorno 30: 12 esercizi.
- Prima dell'inizio e dopo il giorno 30: nessun esercizio, con stato distinto ("non iniziata", "completata").
- Il piano è un dato in ingresso, non è scritto dentro la funzione.

### T1.9 Schema del database · da fare
Migrazioni SQL in `supabase/migrations` per le tabelle di §7.
- Ogni tabella ha il riferimento all'utente e regole di sicurezza per riga: un utente legge e scrive solo le proprie righe.
- Attività giornaliera: una riga per utente e data, con fonte distinta per passi e bici.
- Pasti: includono fibre, sale, pasto libero e testo originale dettato.
- Piano della sfida ed esercizi come tabelle separate; il piano di 30 giorni è inserito come dato iniziale.
- Un file `docs/SCHEMA.md` descrive ogni tabella in una riga.
- Le migrazioni non sono state applicate a un database reale: scrivilo in "Non verificato", a meno che l'ambiente permetta di provarle in locale.

### T1.10 Report di fase · da fare
Scrivi `docs/REPORT-FASE-1.md` come indicato in `CLAUDE.md` e fermati.
