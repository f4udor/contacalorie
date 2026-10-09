# Collegare Personal Health a Salute (Comando rapido su iPhone)

Questa guida serve a far arrivare **passi e km in bici** dall'app Salute dell'iPhone a Personal Health, da soli, più volte al giorno. Non serve saper programmare: sono sei passi, uno per volta. Tempo: circa 30 minuti, quasi tutti per costruire il Comando rapido.

> **Nota.** I nomi delle azioni dei Comandi rapidi (e le loro posizioni) sono scritti **senza averli visti a schermo**: dipendono dalla versione di iOS e dalla lingua e possono essere diversi da quelli qui. Se un'azione ha un nome leggermente diverso, cerca la più simile con la barra di ricerca delle azioni. L'app non può leggere Salute da sola: lo fa il Comando rapido, che poi chiama l'app. Questa guida non è stata provata passo per passo su un iPhone.

> **Il codice è una password.** Chi ha il codice può scrivere passi e km nel tuo account. Non incollarlo in chat, in un'email o in un repository: va solo nel Comando rapido. Se pensi di averlo mostrato a qualcuno, rigeneralo (passo 2): quello vecchio smette subito di funzionare.

**Prima di cominciare servono:**
- Personal Health già collegata a Supabase, con l'accesso fatto (vedi `docs/COLLEGA-SUPABASE.md`): senza account il collegamento non è disponibile;
- l'app aggiornata all'ultima versione pubblicata su Vercel. **Non serve nessuna nuova variabile su Vercel**;
- l'app **Comandi rapidi** dell'iPhone (di serie) e l'app **Salute** con i passi attivi.

**Cosa succede ai dati.**
- Ogni invio manda i passi e i km in bici di **oggi e di ieri**. L'app tiene solo quelle due date: le altre le scarta.
- Ripetere l'invio non crea doppioni: l'ultimo valore sostituisce il precedente.
- I **passi** arrivano solo da Salute e si possono sostituire a ogni invio. Per la **bici**, l'invio scrive solo la parte di Salute: i km che aggiungi a mano nell'app («Bici a mano») si sommano e non vengono mai toccati.
- Un valore mancante o a zero non scrive e non cancella nulla.
- Per la bici arrivano solo i **km**: le kcal le calcola l'app (km × kcal per km, in Impostazioni).

---

## Passo 1. Aggiorna il database

1. Apri **supabase.com**, entra nel tuo progetto e vai su **SQL Editor → New query**.
2. Apri il file `supabase/aggiornamento-fase-5.sql` di questo progetto, copia **tutto** il contenuto, incollalo nell'editor e premi **Run**.

**Cosa vedi:** la scritta **Success. No rows returned**. Il file contiene tutti gli aggiornamenti della fase 5: eseguilo **una volta sola**. Se invece parti da un database nuovo, `supabase/setup.sql` li contiene già e questo file non serve.

Se compare un errore del tipo "already exists", il file era già stato eseguito: non serve rifarlo.

---

## Passo 2. Crea il codice personale

1. Apri l'app, vai su **Impostazioni**, apri **Collegamenti** e cerca la voce **Salute**.
2. Premi **Crea il codice**.
3. Compaiono il **Codice** e l'**Indirizzo**. Premi **Copia** accanto a ciascuno e incollali in un posto sicuro (per esempio in una nota privata) per il passo 3. **Il codice si vede solo questa volta**: quando premi **Fatto** sparisce.
4. Premi **Fatto**.

**Cosa vedi:** la voce **Salute** diventa «Attiva», con ultimo invio «Nessuno».

Se perdi il codice: **Rigenera il codice** ne crea uno nuovo e invalida il vecchio (il Comando rapido smette di inviare finché non lo aggiorni con il nuovo). **Disattiva** lo toglie del tutto.

---

## Passo 3. Costruisci il Comando rapido

Apri **Comandi rapidi**, scheda **Comandi**, premi **+** e dai al comando il nome **Invia a Personal Health**. Aggiungi le azioni in quest'ordine.

**A. I passi**
1. Azione **Trova campioni di dati sanitari**. Imposta:
   - **Tipo**: **Passi**;
   - un filtro **Data di inizio** → **è negli ultimi** → **2** → **giorni**;
   - **Raggruppa per**: **Giorno** (apri le opzioni dell'azione con la freccia, se non si vede).
2. Azione **Ripeti con ciascun elemento** su quei campioni. Dentro il ciclo:
   - **Formatta data**: la **Data di inizio** del campione, formato **Personalizzato**, testo del formato `yyyy-MM-dd` (anno-mese-giorno con i trattini, per esempio `2026-10-08`);
   - **Testo**: scrivi la **Data formattata**, poi un punto e virgola `;`, poi il **Valore** del campione. Risultato: `2026-10-08;8123`.
3. Dopo la fine del ciclo: **Combina testo** sul **Risultato della ripetizione**, con separatore **A capo** (una riga per giorno).
4. **Imposta variabile** chiamata `passi` con quel testo.

**B. I km in bici**
Ripeti A con queste differenze:
- **Tipo**: **Distanza in bici**, con **unità: chilometri (km)**;
- la variabile si chiama `bici`.

**C. L'invio all'app**
1. Azione **Ottieni contenuto dell'URL**. Imposta:
   - **URL**: l'**Indirizzo** copiato al passo 2;
   - apri **Mostra altro** → **Metodo**: **POST**;
   - **Intestazioni** → aggiungi una intestazione: nome `Authorization`, valore `Bearer ` (con lo spazio) seguito dal **Codice** copiato al passo 2;
   - **Corpo della richiesta**: **JSON**, con due campi di tipo **Testo**: `passi` con valore la variabile `passi`, e `bici_km` con valore la variabile `bici`.
2. **Solo per la prova**: azione **Mostra risultato** sul risultato dell'URL. Quando tutto funziona **toglila**, altrimenti ogni esecuzione automatica mostrerebbe una finestra.

**Cosa vedi:** un comando con due blocchi di ciclo e, in fondo, l'azione dell'URL con i campi `passi` e `bici_km`.

Il testo dei due campi può avere formati diversi senza problemi: l'app accetta `;`, la virgola seguita da uno spazio o una tabulazione come separatore, `8.123`, `8 123` o `8123` per i passi, `12,4` o `12.4` per i km, anche con «km» o «passi» dopo il numero, e anche le date `gg/MM/aaaa`. Righe vuote sono ignorate.

---

## Passo 4. Prova a mano

1. Con il telefono **sbloccato**, apri il comando **Invia a Personal Health** e premi il tasto di riproduzione ▶.
2. Se è la prima volta, iOS chiede il permesso di leggere i dati di **Salute** e di contattare il sito: consenti.
3. Leggi la risposta di **Mostra risultato**. Una risposta riuscita è simile a questa:

```
{ "ok": true,
  "salvate": [ { "data": "2026-10-08", "passi": 8123, "bici_km": 12.4 } ],
  "lasciate_manuali": [],
  "scartate": [] }
```

Come si legge:
- **salvate**: le righe scritte nell'app, con data e valori;
- **lasciate_manuali**: oggi sempre vuota (resta per compatibilità): la parte di bici inserita a mano non viene toccata dall'invio, ma non serve elencarla;
- **scartate**: righe che l'app non ha usato, ciascuna con il motivo (per esempio «data fuori da oggi e ieri» o «valore zero»).

Se invece vedi:
- `"Codice non valido."`: il codice è sbagliato, vecchio o disattivato. Controlla che l'intestazione sia `Bearer ` + codice, senza spazi in più, oppure rigenera il codice (passo 2);
- `"Il corpo è vuoto..."`: mancano i campi `passi` e `bici_km` nel corpo JSON;
- `"Nessuna riga utile"`: i dati letti da Salute non avevano righe di oggi o di ieri con un valore sopra zero;
- `"Troppe chiamate oggi"`: l'app accetta al massimo 200 chiamate al giorno per utente. Riprova domani.

Poi apri l'app → **Oggi**: nelle schede **Passi** e **Bici** i valori compaiono con la fonte «da Salute».

---

## Passo 5. Fai partire il comando da solo

Aggiungi **sei orari al giorno**, per esempio 07:30, 10:30, 13:30, 16:30, 19:30 e 22:30.

1. In **Comandi rapidi** apri la scheda **Automazione** e premi **+** → **Crea automazione personale** → **Ora del giorno**.
2. Imposta l'**ora**, **Ripeti: ogni giorno**, poi **Avanti**.
3. Scegli l'azione **Esegui comando rapido** → **Invia a Personal Health**.
4. Nell'ultima schermata attiva **Esegui immediatamente** e **disattiva «Notifica quando viene eseguita»** (se c'è).
5. Ripeti per gli altri cinque orari.

**Cosa vedi:** sei automazioni nella lista, tutte con «Esegui immediatamente».

**Perché a volte non arriva nulla (ed è normale).** Se il telefono è **bloccato**, Salute non è leggibile e quell'invio semplicemente non riesce, senza avvisi. Con sei orari, almeno uno trova il telefono sbloccato: i dati restano comunque quelli di oggi e di ieri e un invio successivo li aggiorna. Per aiutare: sblocca il telefono qualche volta al giorno e non spegnere le automazioni.

---

## Passo 6. Controlla in Impostazioni

Dopo qualche ora apri **Impostazioni → Collegamenti → Salute**:
- **Ultimo invio**: data e ora dell'ultimo invio che ha salvato qualcosa;
- sotto, i **valori ricevuti** per oggi e ieri (passi e km);
- se l'ultimo tentativo non è riuscito, ne vedi il **motivo**.

Se per più di 24 ore non arriva nessun invio riuscito, in cima a **Oggi** compare l'avviso «Nessun dato da Salute da ieri», che porta a questa voce. Nessuna email.

---

## Attenzione: i km possono risultare doppi

Se **un'altra app** (per esempio Strava o l'app del ciclocomputer) scrive in Salute la **stessa uscita** che scrive Fitness, in Salute i km risultano **doppi**, e quindi doppi anche in Personal Health. Soluzioni: registra ogni uscita con **una sola app**, oppure in **Salute → Condivisione → App** togli all'altra app il permesso di scrivere **Distanza in bici**.

**Rimedio nel Comando rapido (provato sul telefono).** Nell'azione che legge la **distanza in bici** aggiungi il filtro **Sorgente è** e scegli l'app con cui registri le uscite (per esempio Strava, oppure l'iPhone se usi Fitness). Così il comando legge solo i km di quell'app e non li somma due volte. Vale per ogni persona con la sua app.

## Se qualcosa non va

- **Niente arriva mai**: rifai la prova a mano (passo 4) e leggi la risposta. Se la risposta è corretta ma le automazioni non scrivono, controlla che siano attive e che il telefono sia sbloccato negli orari.
- **I passi sono diversi da Salute**: Salute può mostrare la somma di più sorgenti (iPhone e Watch), l'app prende il valore del giorno che il comando le manda: controlla il tipo **Passi** e **Raggruppa per Giorno**.
- **Un valore è sbagliato**: passi e km da Salute non si correggono nell'app (si correggono in Salute e l'invio successivo li sostituisce). Per un'uscita in bici non registrata sul telefono usa **+** → **Bici a mano**: i km si sommano a quelli di Salute.

## Come tornare indietro

In **Impostazioni → Collegamenti → Salute** premi **Disattiva**: il codice smette di funzionare subito. Poi puoi cancellare il Comando rapido e le sei automazioni. I dati già arrivati restano.
