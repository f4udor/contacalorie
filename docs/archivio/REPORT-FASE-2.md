# Report fase 2: schermate con dati salvati nel browser

## 1. In parole semplici

**Cosa c'è ora.** Un'app con quattro schede in basso: **Oggi**, **Settimana**, **Grafici** (per ora solo "In arrivo") e **Impostazioni**.
- **Oggi**: la data con le frecce, l'anello delle kcal rimaste (diventa giallo e poi rosso se si esagera), la riga che spiega l'obiettivo del giorno ("Base 2.100 · bici +405 · passi +75 · recupero −106"), le cinque schede dei nutrienti con la barretta a semaforo, i pasti per fascia, l'attività e la sfida mattutina.
- **Il pulsante +**: pasto a mano, "Copia da ieri", attività a mano, pesata. Al posto del microfono c'è lo spazio "Inserimento a voce: in arrivo".
- **Settimana**: sette barre con la linea dell'obiettivo di ogni giorno, saldo, medie, km, passi, pasto libero, giorni di sfida. Toccando una barra si apre quel giorno.
- **Impostazioni**: profilo, obiettivi, regole di calcolo, pasto libero e data di inizio della sfida, con un messaggio accanto ai campi sbagliati e "Ripristina valori predefiniti".
- Tema chiaro e scuro automatici, pensata per iPhone, installabile sulla Home.

**Dove stanno i dati.** Per ora **dentro il browser del dispositivo**. Ne segue che telefono e computer **non condividono** i dati (lo farà Supabase, quando lo collegherai) e che cancellare i dati del sito dal browser cancella anche i tuoi pasti. Niente intelligenza artificiale, niente Comandi rapidi, niente grafici: sono le fasi 3, 4 e 5.

**Come provarla.** In questa sessione non è stata pubblicata da nessuna parte, quindi non c'è ancora un indirizzo da aprire sul telefono. Qualcuno deve metterla online (oppure avviarla su un computer con `npm run build` e `npm start`). Per installarla sulla Home dell'iPhone serve un indirizzo sicuro (https). Questa parte **non è stata provata**. Gli screenshot di ogni schermata, in chiaro e in scuro, sono in `docs/screenshots/`.

**Cosa manca.** Grafici (fase 5), inserimento a voce e AI (fase 3), ingresso dei dati da Salute (fase 4), collegamento a Supabase e al login, dati condivisi tra dispositivi.

### 10 controlli da fare in cinque minuti sul telefono

Quando l'app è online, apri l'indirizzo con Safari e prova così (con l'app appena aperta, senza dati):

1. **Oggi vuoto**: vedi "Oggi", un anello grigio con **2.100** kcal rimaste e un invito a inserire il peso nella scheda Proteine.
2. **Primo pasto**: tocca **+** → *Pasto a mano*, scrivi solo **500** nelle kcal e premi *Aggiungi pasto*. Il pasto compare sotto "Pranzo" e l'anello scende a **1.600**.
3. **Modifica ed elimina**: tocca il pasto, cambia le kcal a **600**, *Salva*. Riaprilo, tocca *Elimina pasto*, poi *Annulla* e infine di nuovo *Elimina* e conferma.
4. **Pasto libero**: aggiungi un pasto da **1.100** kcal con *Pasto libero* attivo: le kcal rimaste calano di **800**, non di 1.100. Prova ad aggiungerne un secondo libero: l'interruttore è spento e spiega perché.
5. **Copia da ieri**: con la freccia ‹ vai a ieri, aggiungi un pasto, torna con *Oggi*, tocca **+** → *Copia da ieri*: il pasto arriva come pasto normale. Il giorno dopo un giorno vuoto, lo stesso tasto dice che non c'è nulla da copiare.
6. **Pesata**: **+** → *Pesata*, scrivi **90**. La scheda Proteine mostra "/ 125 g".
7. **Attività**: **+** → *Attività a mano*, **9000** passi. L'obiettivo sale di 75 e la riga sotto l'anello dice "passi +75".
8. **Sfida**: in *Impostazioni* metti l'inizio della sfida a oggi e salva. In Oggi compare "Giorno 1/30 · fatti 0 su 3": spunta un esercizio e toccane un altro per cambiare le ripetizioni o saltarlo.
9. **Settimana**: apri la scheda *Settimana*, guarda le barre, tocca una barra (si apre quel giorno) e usa le frecce per cambiare settimana.
10. **Dati, tema e Home**: chiudi Safari e riaprilo (i dati ci sono ancora); cambia il tema del telefono tra chiaro e scuro e controlla che tutto si legga; infine *Condividi → Aggiungi alla schermata Home* e apri l'app dall'icona: deve aprirsi a schermo intero, senza barra di Safari, con il nome "Personal Health".

Se qualcosa non torna, annota quale schermata e cosa vedi: sono le uniche cose che servono.

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T2.0 Sportello dei dati (`src/data`) | fatto |
| T2.1 Guscio dell'app | fatto (respinto una volta: avviso fuori dall'area sicura e screenshot oltre 844 px) |
| T2.2 Oggi: anello e nutrienti | fatto |
| T2.3 Pasti | fatto (respinto una volta: stato vuoto con zeri) |
| T2.4 Attività e pesata | fatto |
| T2.5 Sfida mattutina | fatto |
| T2.6 Settimana | fatto |
| T2.7 Impostazioni | fatto |
| T2.8 Rifinitura grafica | fatto |
| T2.9 Report di fase | questo file |

Nessun task bloccato in questa fase, quindi nessun ultimo tentativo da fare. T1.0 (bloccato in fase 1) risulta già chiuso su `main`. Il ramo di lavoro è stato riallineato a `main` (che conteneva la fase 1 e i task della fase 2). Un commit "in attesa di revisione" per task, poi un commit di chiusura.

**Processo.** Revisioni fatte dal subagente `revisore` (questa volta disponibile). T2.0, T2.2, T2.4, T2.5, T2.6, T2.7 e T2.8 approvati al primo giro; T2.1 e T2.3 al secondo.

### Struttura
- `src/data`: interfaccia `DataStore` (asincrona) con implementazione in memoria e nel browser (`localStorage`, formato versione 1, dati illeggibili → si riparte vuoti con avviso). Una regola di lint vieta `localStorage` fuori da `src/data`. I campi ricalcano `docs/SCHEMA.md`: il passaggio a Supabase cambierà solo l'implementazione.
- `src/app`: schermate e componenti; la logica di presentazione è in funzioni pure testate (`today-view`, `week-view`, `challenge-view`, `meal-form`, `activity-form`, `settings-form`, `copy-meals`, `format`, `week-data`). Le formule restano in `src/engine`, che in questa fase non è stato modificato.
- `tools/screens.mjs` (`npm run screens`) e `tests/fixtures/build-fixtures.mjs` (`npm run fixtures`): 52 scenari di dati di esempio, 312 screenshot (chiaro/scuro × 375, 390, 430 px) in `docs/screenshots/`. Lo script segnala scorrimento orizzontale, aree toccabili sotto 44 px e pagine più alte di 844 px non volute.

### Test
- 215 test in 21 file (Vitest), tutti verdi; `lint` e `build` passano. In questa fase: 109 → 215.
- Coperti: sportello dei dati (entrambe le implementazioni, dati corrotti, versione sconosciuta, scrittura impossibile), formati italiani, caricamento della settimana, vista di Oggi (casi B ed E del brief con i numeri esatti), moduli pasto/attività/pesata/impostazioni (campi vuoti, virgola, errori, nessun salvataggio se un campo è sbagliato), copia da ieri, sfida (giorni 1, 4, 30, prima e dopo), vista della settimana, regola del trascinamento del pannello.
- Non coperti da test automatici: i componenti grafici (verificati con gli screenshot) e il trascinamento reale del pannello (provato a mano in un browser headless).
- La percentuale di copertura non è stata misurata (nessuno strumento installato).

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali di questa fase:
- le kcal rimaste usano il budget (pasto libero col tetto), le "mangiate" quelle reali; con nessun pasto le barrette sono neutre e al posto degli zeri c'è "–";
- senza peso anche i carboidrati non mostrano l'obiettivo (dipende dalle proteine);
- le kcal della bici scritte a mano stanno nello stesso campo di quelle di Salute, con fonte "manuale";
- una pesata per giorno (la seconda sostituisce la prima); passi e kcal interi;
- giorno di sfida "completato" = tutti gli esercizi fatti (un esercizio saltato non conta); togliere la spunta cancella anche le ripetizioni modificate;
- Impostazioni: un solo "Salva", campo vuoto = valore predefinito, percentuali per margine e quota di bonus, limiti dei campi di buon senso, "Ripristina" lascia profilo e data della sfida;
- accento del tema scuro più saturo (#0a84ff) per il contrasto del testo bianco sui pulsanti.

### Limiti e cose non verificate
- **Nessuna prova su iPhone reale**: installazione sulla Home, schermo intero, aree sicure (notch e barra home), tocco e trascinamento reali, tastiera numerica con la virgola, selettore data in italiano (negli screenshot appare mm/gg/aaaa per la lingua del browser di prova).
- Dati solo nel browser: nessuna condivisione tra dispositivi, nessun backup; su Safari i dati di un sito non installato possono essere eliminati dal sistema dopo un periodo di inattività (non verificato).
- Gli screenshot a 375 e 430 px e tutti i temi sono stati controllati dallo script e a campione a occhio, non ad uno ad uno.
- Il campo di login e Supabase non sono collegati; `docs/SCHEMA.md` e le migrazioni della fase 1 restano non provate su Supabase reale.
