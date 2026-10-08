# Personal Health: brief di prodotto

## 1. Scopo

App personale per tracciare dieta ipocalorica e attività fisica. Un solo utente, su iPhone (web app installata sulla Home) e computer, con gli stessi dati. Deve essere semplice, solida e ampliabile per moduli.

## 2. Schermate

Navigazione in basso: **Oggi, Settimana, Grafici, Impostazioni**.

### Oggi
1. Data con frecce per cambiare giorno e tasto "Oggi".
2. Anello delle kcal: rimaste al centro; sotto, la riga di composizione dell'obiettivo ("Base 2.100 · bici +400 · passi +75 · recupero −100"), solo se c'è qualcosa oltre alla base.
3. Griglia di schede dei nutrienti: proteine, carboidrati, grassi, fibre, sale. Ogni scheda: nome, "assunto su obiettivo", barretta colorata a semaforo.
4. Pasti del giorno: Colazione, Pranzo, Cena, Spuntino. Ogni pasto è composto da uno o più piatti e mostra il totale di kcal e macro, con i piatti elencati sotto ed etichetta "libero" se lo è. Ogni piatto si modifica o elimina; ogni pasto ha il suo "Aggiungi piatto". Scorrendo un piatto verso sinistra compaiono "Preferiti" e il cestino; il cestino elimina subito, senza conferma.
5. Attività: passi e bici (km, kcal), con la fonte ("da Salute" o "manuale").
6. Avviso in cima se i dati da Salute non arrivano da più di un giorno (§5).
7. Pulsante **+** sempre visibile.

### Pannello Aggiungi (dal +)
- In cima: un campo di testo "Cosa hai mangiato?". L'utente scrive o detta con il microfono della tastiera dell'iPhone, il modello AI restituisce uno o più pasti con i loro piatti stimati, l'utente conferma, corregge i numeri a mano oppure invia una correzione a voce o testo ("il totano era di più") che aggiorna la stima.
- Accanto al titolo un selettore **AI | Manuale**; si apre sempre su AI. "Manuale" mostra il piatto a mano con nome e quantità: i numeri sono facoltativi e, se restano vuoti, li stima il modello AI e l'utente conferma.
- La proposta dell'AI mostra ogni piatto su una riga (nome, quantità, kcal); toccandola si aprono i numeri da correggere.
- "Aggiungi piatto" sotto un pasto apre lo stesso pannello, su AI, con la fascia già fissata.
- Preferiti (piatti e pasti salvati): ogni riga ha un + per aggiungerla; "Modifica" mostra i comandi per eliminarli.
- Interruttore "Pasto libero" sul pasto intero, disattivato se già usato nella settimana.
- Voci separate: "Pesata" e "Attività a mano".

### Settimana (lunedì-domenica)
- Sette barre delle kcal mangiate con la linea dell'obiettivo di ogni giorno.
- Saldo della settimana, media kcal, medie dei nutrienti, km in bici, passi medi, pasto libero usato o no.
- Peso: ultima pesata della settimana e differenza in kg con la pesata precedente (o con il peso di partenza del profilo), verde se ci si avvicina al peso obiettivo e rosso se ci si allontana. La scheda c'è sempre: senza pesate nella settimana dice "Nessuna pesata". Il peso del profilo è il peso di partenza e le pesate non lo sovrascrivono; consigliata una pesata a settimana, stesso giorno, al mattino.
- Le schede Peso, Bici, Passi e Pasto libero si toccano e aprono un pannello: pesate da eliminare o aggiungere; giorni di bici e di passi, dove si eliminano solo i valori inseriti a mano; pasto libero da togliere (il pasto resta, torna normale) o da scegliere tra i pasti della settimana.

### Grafici
- Peso, kcal e deficit, macro medi, attività. Periodo: 4 settimane, 3 mesi, tutto.

### Impostazioni
- Profilo: peso, altezza, età, peso obiettivo.
- Obiettivi: kcal base, soglia minima, recupero massimo al giorno, margine massimo della settimana, grammi dei nutrienti (proposti, ritoccabili), margine dei semafori.
- Attività: kcal per km, kcal per passo, soglia passi, quota di bonus.
- Pasto libero: tetto di kcal.
- Collegamenti: modello AI, codice personale per il Comando rapido di Salute.
- Stato delle automazioni: data e ora dell'ultimo invio riuscito da Salute e valori ricevuti.
- Dati: esportazione in CSV/Excel.

## 3. Regole di calcolo

Tutti i valori sono impostazioni con questi default.

| Impostazione | Default |
|---|---|
| `baseKcal` | 2100 |
| `floorKcal` | 1800 |
| `recoveryMaxPerDay` | 100 |
| `recoveryMin` | 25 |
| `creditCap` | 300 |
| `bonusShare` | 0,5 |
| `kcalPerKm` | 27 |
| `kcalPerStep` | 0,05 |
| `stepThreshold` | 6000 |
| `freeMealCap` | 800 |
| `proteinPerKg` | 1,4 |
| `proteinPerKgTarget` | 1,8 |
| `fatShare` | 0,30 |
| `fiberMin` | 30 g |
| `saltMax` | 5 g |
| `margin` | 0,10 |
| `overLimit` | 1,5 |

### 3.1 Kcal contate nel budget
Un pasto è l'insieme dei piatti di una fascia (colazione, pranzo, cena, spuntino) in un giorno. `kcalBudget(giorno)` = somma delle kcal dei piatti, dove per un pasto libero la somma dei suoi piatti conta `min(somma, freeMealCap)`. Le kcal mostrate come "mangiate" sono sempre quelle reali.

Pasto libero: si segna sul pasto intero, al massimo uno per settimana. Gli altri sgarri si inseriscono come piatti normali e contano per intero.

### 3.2 Bonus attività
- `kcalBici` = kcal registrate da Salute se presenti, altrimenti `km × kcalPerKm`.
- `bonusBici` = arrotonda(`bonusShare × kcalBici`).
- `bonusPassi` = arrotonda(`bonusShare × max(0, passi − stepThreshold) × kcalPerStep`).

### 3.3 Obiettivo del giorno
Principio: conta il bilancio della settimana, e uno sgarro si recupera con correzioni piccole, mai con tagli forti.

Per il giorno di indice `i` nella settimana (lunedì = 0):

1. `saldo`: si parte da 0 e si scorrono in ordine i giorni precedenti della stessa settimana **che hanno almeno un pasto**. Per ciascuno si somma `baseKcal + bonusBici + bonusPassi − kcalBudget` e, dopo ogni giorno, il saldo si limita a `creditCap` (`saldo = min(saldo, creditCap)`). Il margine positivo quindi non supera mai `creditCap`; il debito non ha tetto, ma si cancella il lunedì.
2. `debito` = `max(0, −saldo)`. `recupero` = 0 se `debito < recoveryMin`, altrimenti `−min(debito, recoveryMaxPerDay)`. Un saldo positivo non alza l'obiettivo: fa solo da cuscinetto per gli sgarri successivi della settimana.
3. `baseDelGiorno` = `max(min(floorKcal, baseKcal), baseKcal + recupero)`.
4. `obiettivo` = arrotonda(`baseDelGiorno + bonusBici + bonusPassi`) del giorno stesso.

La soglia minima vale per la base: il bonus attività si somma sopra. Ogni lunedì il saldo riparte da zero: debito e margine non passano alla settimana dopo.

**Anteprima dei giorni futuri.** Quando si mostra l'obiettivo di un giorno successivo a oggi, i giorni tra oggi e quel giorno che non hanno pasti contano come se si mangiasse esattamente il loro obiettivo; oggi conta con le kcal reali se sono sopra l'obiettivo, altrimenti come se si raggiungesse l'obiettivo. Così un debito di 250 kcal appare come −100, −100, −50 e non viene mostrato più volte.

**Saldo mostrato in Settimana.** È lo stesso saldo della regola (con il tetto al margine), calcolato fino al giorno più recente con pasti.

### 3.4 Obiettivi dei nutrienti
- Proteine = `proteinPerKgTarget × peso obiettivo` se il peso obiettivo è impostato, altrimenti `proteinPerKg × peso`; arrotondate ai 5 g. Il peso è l'ultima pesata, o quello del profilo se non ci sono pesate.
- Grassi = `fatShare × baseKcal / 9`, arrotondati ai 5 g.
- Carboidrati = `(obiettivo del giorno − proteine × 4 − grassi × 9) / 4`. Assorbono ogni variazione dell'obiettivo: salgono nei giorni di bici, scendono nei giorni di recupero.
- Fibre = `fiberMin`. Sale = `saltMax`.

Se l'utente inserisce a mano i grammi di proteine o grassi, quel valore sostituisce la formula.

### 3.5 Semafori
Con `x` = assunto, `T` = obiettivo, `m` = `margin`:

| Tipo | Nutrienti | Giallo | Verde | Rosso |
|---|---|---|---|---|
| Minimo | proteine, fibre | `x < T(1−m)` | da `T(1−m)` a `T × overLimit` | `x > T × overLimit` |
| Intervallo | carboidrati, grassi | `x < T(1−m)` | da `T(1−m)` a `T(1+m)` | `x > T(1+m)` |
| Tetto | sale | da `T(1−m)` a `T` | `x < T(1−m)` | `x > T` |

Anello delle kcal: colore d'accento fino a `T`, giallo da `T` a `T × 1,05`, rosso oltre.

### 3.6 Casi di verifica
Default della tabella, peso 100 kg (proteine 140 g, grassi 70 g). Questi numeri devono uscire identici dai test.

| # | Situazione | Risultato atteso |
|---|---|---|
| A | Lun 1.750 kcal, mar 1.800. Mercoledì: 9.000 passi, nessuna bici | Obiettivo mer = 2.175 (bonus passi 75) |
| B | Come A; mercoledì mangiate 3.250 kcal, nessun pasto libero. Giovedì senza attività | Margine fermo a 300 dopo lun e mar; saldo −775, recupero −100, obiettivo gio = 2.000 |
| C | Come B, ma il pranzo di mercoledì da 2.250 kcal è pasto libero | `kcalBudget` mer = 1.800, saldo = 300 (tetto), obiettivo gio = 2.100 |
| D | Lunedì 5.000 kcal, nessun pasto libero. Martedì senza attività | Saldo −2.900, recupero −100: obiettivo mar = 2.000. Con `recoveryMaxPerDay` = 500 vale la soglia minima: obiettivo mar = 1.800 |
| E | Bici 30 km inserita a mano, nessun saldo negativo | Bonus 405, obiettivo = 2.505, carboidrati = 329 g |
| F | Bici con 800 kcal da Salute, nessun saldo negativo | Bonus 400, obiettivo = 2.500, carboidrati = 328 g |
| G | Giorno base a 2.100 kcal | Carboidrati = 228 g |
| H | Giorno senza pasti tra lunedì e oggi | Non entra nel saldo |
| I | Proteine 125 g su 140 | Giallo (soglia verde 126) |
| J | Sale 4,8 g su 5 | Giallo; 5,1 g rosso; 4,4 g verde |
| K | Peso 105 kg, peso obiettivo 85 kg | Proteine = 155 g (1,8 × 85 = 153, arrotondato ai 5 g) |
| L | Pranzo libero di tre piatti da 500, 400 e 300 kcal | Mangiate 1.200, contate nel budget 800 |
| M | Lunedì 2.111 kcal. Martedì senza attività | Debito 11, sotto `recoveryMin`: recupero 0, obiettivo mar = 2.100 |
| N | Lunedì 2.300 kcal; martedì e mercoledì mangiate 2.000 | Obiettivo mar = 2.000, mer = 2.000, gio = 2.100 (debito estinto) |
| O | Lun, mar e mer a 1.800 kcal; giovedì 2.500 | Margine 300 (non 900); saldo dopo gio −100; obiettivo ven = 2.000 |
| P | Domenica 3.000 kcal | Lunedì successivo: saldo 0, obiettivo = 2.100 |
| Q | Oggi è giovedì senza pasti, saldo −250 dai giorni precedenti | Anteprima: gio 2.000, ven 2.000, sab 2.050, dom 2.100 |
| R | Oggi è giovedì, saldo 0 dai giorni precedenti, mangiate finora 2.111 su 2.100 | Anteprima ven = 2.100 (debito 11 sotto `recoveryMin`) |

## 4. Pasti e modello AI

- **Cosa riceve il modello**: solo il testo scritto o dettato dall'utente, la data e l'ora locali (per dedurre la fascia) ed eventualmente la stima precedente con la correzione. Nessun altro dato dell'utente: niente peso, obiettivi, email.
- **Cosa restituisce**: uno o più pasti; per ogni pasto la fascia (colazione, pranzo, cena, spuntino) e i piatti. Per ogni piatto: nome, quantità, se la quantità è stata ipotizzata, kcal, proteine, carboidrati, grassi, fibre, sale, e una nota breve.
- **Fascia**: quella detta dall'utente ("a pranzo"); se non la dice, si deduce dall'ora. Si può cambiare prima di confermare.
- **Quantità**: se l'utente non le dice, il modello usa porzioni standard di un adulto, le scrive nella proposta e le segna come ipotizzate. Non fa domande.
- **Piatti separati**: "anelli di totano e un'insalata di pomodorini" diventano due piatti dello stesso pasto, ciascuno con la sua stima.
- Nulla viene salvato senza conferma dell'utente. Ogni piatto stimato conserva il testo originale.
- **Provider**: intercambiabile dietro `AiProvider`. Il primo è Gemini su **Vertex AI** (Google Cloud), chiamato solo dal server. Modello, progetto e regione sono variabili d'ambiente. In sviluppo si usa un provider finto con risposte fisse.
- **Protezioni**: solo utenti con accesso possono chiamare il modello; massimo 60 stime al giorno per utente (impostazione del server); risposta del modello sempre validata prima di mostrarla.
- **Preferiti**: piatti singoli e pasti interi salvati con i loro numeri, da riaggiungere senza passare dal modello. Niente ricette con ingredienti, niente foto.

## 5. Attività e automazioni

Salute e Promemoria di Apple non sono raggiungibili da un server: i dati arrivano da Comandi rapidi su iPhone che chiamano l'app.

### Dati da Salute
- **Cosa manda il Comando rapido.** Un solo comando legge da Salute i passi e la distanza in bici degli ultimi 2 giorni, raggruppati per giorno, e li invia all'app. Parte da solo più volte al giorno; a telefono bloccato Salute non è leggibile e quell'invio semplicemente non riesce, senza avvisi. Verificato su iPhone: il raggruppamento per giorno funziona per passi e bici; le uscite registrate con Fitness arrivano in "Distanza in bici" con i km giusti; a telefono bloccato il comando non mostra errori.
- **Cosa tiene l'app.** Solo le righe di **oggi e di ieri** (fuso `Europe/Rome`): le altre si scartano. Ripetere lo stesso invio non crea doppioni: l'ultimo valore sostituisce il precedente. Un valore inserito a mano non viene mai sovrascritto. Un valore mancante o a zero non scrive e non cancella nulla.
- **Bici.** Arrivano solo i km: le kcal si calcolano con `km × kcalPerKm` (§3.2), perché i Comandi rapidi non leggono gli allenamenti.
- **Codice personale.** L'ingresso è protetto da un codice generato in Impostazioni → Collegamenti, uno per utente. Si vede in chiaro una sola volta; nel database resta solo l'impronta. Rigenerarlo invalida il precedente.
- **Guardiano.** Se esiste un codice e da più di 24 ore non arriva un invio riuscito, Oggi mostra un avviso. Nessuna email.
- Ogni invio registra data, ora ed esito; Impostazioni mostra l'ultimo invio riuscito e i valori ricevuti.
- Avvertenza per chi usa l'app: se un'altra app (per esempio Strava) scrive la stessa uscita in Salute, i km risultano doppi. Si registra con una sola app, oppure si toglie all'altra il permesso di scrivere "Distanza in bici".

### Rimandati
- **Ingresso pasto**: testo dettato a Siri che crea una stima in attesa di conferma.
- **Ingresso promemoria** (modulo opzionale, ultima fase): restituisce i promemoria da creare, già scritti, una sola volta per giorno.

## 6. Sfida mattutina

Rimossa dall'app nella fase 4. Le sue tabelle restano nel database, inutilizzate, perché il database cresce solo per aggiunte.

## 7. Dati

Login con email e codice di 6 cifre ricevuto per email, senza password. Niente link magico: su iPhone aprirebbe Safari e non l'app installata sulla Home. Ogni riga appartiene a un utente e nessuno può leggere righe altrui.

Tabelle previste: impostazioni, pasti, preferiti, attività giornaliera, pesate, piani della sfida, esercizi del piano, registro giornaliero della sfida, token degli ingressi, registro delle chiamate agli ingressi.

## 8. Fasi

| Fase | Contenuto |
|---|---|
| 1 | Motore dei calcoli con test, schema del database |
| 2 | Schermate Oggi, Settimana, Impostazioni; peso; sfida (poi rimossa) |
| 3 | Supabase: login, dati online, importazione dal browser; pasti composti da piatti; proteine sul peso obiettivo |
| 4 | Inserimento con AI (Vertex), piatti a mano con stima, preferiti, rimozione della sfida, primo avvio guidato |
| 4b | Ritocchi delle schermate: AI o Manuale, proposta compatta, preferiti, peso nella Settimana |
| 5 | Dati da Salute tramite Comando rapido e avviso; nuova regola del recupero; schede della Settimana toccabili; scorrimento per eliminare |
| 6 | Grafici |
| 7 | Promemoria (opzionale) |

## 9. Fuori dalla prima versione

Sfida mattutina e programmi di allenamento, gestione inviti nell'app (gli accessi si gestiscono da Supabase), attività diverse da bici e passi, app nativa, foto del piatto, Strava, velocità media e durata delle uscite, obiettivo del giorno modificabile a mano, nutrienti modificabili giorno per giorno, email del guardiano, app a pagamento per leggere Salute.
