# Personal Health: brief di prodotto

## 1. Scopo

App personale per tracciare dieta ipocalorica e attività fisica. Un solo utente, su iPhone (web app installata sulla Home) e computer, con gli stessi dati. Deve essere semplice, solida e ampliabile per moduli.

## 2. Schermate

Navigazione in basso: **Oggi, Settimana, Grafici, Impostazioni**.

### Oggi
1. Data con frecce per cambiare giorno e tasto "Oggi".
2. Anello delle kcal: rimaste al centro; sotto, la riga di composizione dell'obiettivo ("Base 2.100 · bici +400 · passi +75 · recupero −100"), solo se c'è qualcosa oltre alla base.
3. Griglia di schede dei nutrienti: proteine, carboidrati, grassi, fibre, sale. Ogni scheda: nome, "assunto su obiettivo", barretta colorata a semaforo.
4. Pasti del giorno: Colazione, Pranzo, Cena, Spuntino. Ogni pasto è composto da uno o più piatti e mostra il totale di kcal e macro, con i piatti elencati sotto ed etichetta "libero" se lo è. Ogni piatto si modifica o elimina; ogni pasto ha il suo "Aggiungi piatto". Scorrendo un piatto verso sinistra compaiono "Preferiti" e il cestino; il cestino elimina subito, senza conferma. Se il piatto è già tra i preferiti (stesso nome e stessa quantità, senza badare a maiuscole e spazi), al posto di "Preferiti" c'è "Rimuovi dai preferiti": un piatto non finisce mai due volte tra i preferiti.
5. Attività: passi e bici (km, kcal), con la fonte ("da Salute" o "manuale"). I passi sono in sola lettura: toccarli non apre nulla. Della bici si tocca solo la parte inserita a mano (§5).
6. Avviso in cima se i dati da Salute non arrivano da più di un giorno (§5).
7. Pulsante **+** sempre visibile.

### Pannello Aggiungi (dal +)
- In cima: un campo di testo "Cosa hai mangiato?". L'utente scrive o detta con il microfono della tastiera dell'iPhone, il modello AI restituisce uno o più pasti con i loro piatti stimati, l'utente conferma, corregge i numeri a mano oppure invia una correzione a voce o testo ("il totano era di più") che aggiorna la stima.
- **Una sola scheda per aggiungere e per modificare un piatto**, con gli stessi comandi nello stesso posto. In alto: "Chiudi" a sinistra, il titolo, "Salva" a destra, sempre visibili anche con la tastiera aperta e con il contenuto che scorre; nessun pulsante di salvataggio in fondo.
- Sotto il titolo lo stesso selettore **AI | Manuale**: in aggiunta si apre su AI, in modifica su Manuale. In modifica, AI mostra il campo per correggere a parole la stima del piatto ("era di più"). In Manuale c'è sempre il pulsante "Stima con l'AI", che riempie kcal e nutrienti da nome e quantità anche quando i campi hanno già dei numeri; l'utente vede i nuovi numeri e salva.
- Accanto al titolo un selettore **AI | Manuale**; in aggiunta si apre sempre su AI. "Manuale" mostra il piatto a mano con nome e quantità: i numeri sono facoltativi e, se restano vuoti, li stima il modello AI e l'utente conferma.
- La proposta dell'AI mostra ogni piatto su una riga (nome, quantità, kcal); toccandola si aprono i numeri da correggere. Ogni pasto proposto ha il suo interruttore "Pasto libero", con le stesse regole dell'inserimento a mano; se l'utente lo ha detto nella frase arriva già acceso e si può spegnere. Un piatto la cui stima non supera il controllo di coerenza (§3.7) mostra un avviso breve.
- "Aggiungi piatto" sotto un pasto apre lo stesso pannello, su AI, con la fascia già fissata.
- Preferiti (piatti e pasti salvati): ogni riga ha un + per aggiungerla e si elimina scorrendola verso sinistra, con lo stesso gesto e lo stesso cestino dei piatti in Oggi (subito, senza conferma).
- Interruttore "Pasto libero" sul pasto intero, disattivato se già usato nella settimana.
- Voci separate: "Pesata" e "Bici a mano". I passi non si inseriscono a mano.

### Settimana (lunedì-domenica)
- Sette barre delle kcal mangiate con la linea dell'obiettivo di ogni giorno e una linea tratteggiata orizzontale alla media kcal della settimana, con etichetta ("media 2.040"), distinta a colpo d'occhio dalla linea dell'obiettivo.
- Saldo della settimana, media kcal (§3.8, lo stesso numero della linea), medie dei nutrienti, km in bici, passi medi, pasto libero usato o no.
- Peso: ultima pesata della settimana e differenza in kg con la pesata precedente (o con il peso di partenza del profilo), sempre con il segno e un decimale ("−0,4 kg", "+0,3 kg", mai "0 kg" per una variazione di qualche etto), verde se ci si avvicina al peso obiettivo e rosso se ci si allontana. La scheda c'è sempre: senza pesate nella settimana dice "Nessuna pesata". Il peso del profilo è il peso di partenza e le pesate non lo sovrascrivono; consigliata una pesata a settimana, stesso giorno, al mattino.
- Le schede Peso, Bici, Passi e Pasto libero si toccano e aprono un pannello: pesate da eliminare o aggiungere; giorni di bici, dove si aggiunge, modifica o elimina solo la parte inserita a mano; giorni di passi, in sola lettura salvo i vecchi valori a mano, che si possono solo eliminare; pasto libero da togliere (il pasto resta, torna normale) o da scegliere tra i pasti della settimana.

### Grafici
- Peso, kcal e deficit, macro medi, attività. Periodo: 4 settimane, 3 mesi, tutto.

### Impostazioni
La schermata è un elenco di sezioni, come le Impostazioni dell'iPhone: ogni riga apre la sua pagina, con "Indietro". Ordine: Profilo, Obiettivi, Attività, Pasto libero, Dati e, staccata in fondo, Collegamenti. Niente campi nella prima pagina: così non si toccano per sbaglio le cose delicate. Ogni campo ha un nome chiaro e al massimo una riga di spiegazione breve; niente paragrafi.
- Profilo: sesso, età, altezza, peso, peso obiettivo, data entro cui raggiungerlo.
- Obiettivi: kcal base e grammi dei nutrienti, ciascuno mostrato come valore **calcolato** dal profilo (§3.9) oppure **personalizzato** se l'utente lo ha scritto a mano, con "Usa il valore calcolato" per tornare indietro; metabolismo basale in sola lettura (è il minimo sotto cui la base non scende); recupero massimo al giorno, margine massimo della settimana, margine dei semafori. Il campo "soglia minima" non c'è più.
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
| `recoveryMin` | 50 |
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
| `sedentaryFactor` | 1,2 |
| `kcalPerKg` | 7700 |
| `ringGreenBelow` | 150 kcal |
| `ringGreenAbove` | 50 kcal |
| `ringYellowAbove` | 200 kcal |
| `kcalCheckShare` | 0,20 |
| `kcalCheckMin` | 40 kcal |

`sedentaryFactor`, `kcalPerKg` e le ultime cinque sono costanti del motore in `defaults.ts`: non hanno un campo in Impostazioni né una colonna nel database.

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

Anello delle kcal. Con `d` = kcal contate nel budget − obiettivo del giorno:

| Colore | Condizione |
|---|---|
| Accento (in corso) | `d < −ringGreenBelow` |
| Verde | da `−ringGreenBelow` a `+ringGreenAbove`, estremi compresi |
| Giallo | oltre `+ringGreenAbove`, fino a `+ringYellowAbove` compreso |
| Rosso | `d > +ringYellowAbove` |

`ringGreenAbove` e `recoveryMin` hanno lo stesso valore: finché l'anello è verde, il giorno dopo non scatta nessun recupero. Un giorno senza pasti resta nel colore d'accento. Le barre della Settimana usano gli stessi colori.

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

### 3.7 Coerenza delle stime
Per un piatto stimato dal modello: `kcalMacro` = `4 × proteine + 4 × carboidrati + 9 × grassi`. La stima è "da controllare" se le kcal dichiarate sono più basse di `kcalMacro` di oltre `kcalCheckShare` **e** di oltre `kcalCheckMin` kcal. Si segnala solo la sottostima: è l'errore che danneggia la dieta, e l'alcol alza le kcal senza comparire nei macro. Il controllo avvisa, non blocca e non corregge i numeri.

### 3.8 Media kcal della settimana
Media delle kcal mangiate nei giorni della settimana che hanno almeno un pasto, **escluso il giorno di oggi** (è in corso e abbasserebbe la media). Senza giorni validi non c'è media: la scheda mostra il trattino e la linea non compare. La scheda "Media kcal" e la linea del grafico usano lo stesso numero.

Casi di verifica aggiuntivi (obiettivo del giorno 2.100):

| # | Situazione | Risultato atteso |
|---|---|---|
| S | Contate 1.949 / 1.950 / 2.150 / 2.151 / 2.300 / 2.301 | accento / verde / verde / giallo / giallo / rosso |
| Z | Lunedì 2.140 kcal. Martedì senza attività | Debito 40, sotto `recoveryMin`: recupero 0, obiettivo mar = 2.100. Con 2.150 kcal: debito 50, recupero −50, obiettivo mar = 2.050 |
| T | Piatto con 110 kcal, proteine 13, carboidrati 72, grassi 6 (`kcalMacro` 394) | Da controllare |
| U | Birra: 215 kcal, proteine 2, carboidrati 18, grassi 0 (`kcalMacro` 80) | Non segnalata |
| V | Piatto con 380 kcal e `kcalMacro` 394 | Non segnalato |
| W | Oggi è giovedì. Lun 2.000, mar senza pasti, mer 2.200, gio (oggi) 600 | Media 2.100 |
| X | Oggi è lunedì, con pasti solo oggi | Nessuna media |
| Y | Settimana passata con 7 giorni di pasti | Media sui 7 giorni |

### 3.9 Obiettivi calcolati dal profilo
Formule fisse, rudimentali ma dichiarate. Servono: sesso, età, altezza (cm), peso (ultima pesata, o quello del profilo). Per il piano servono anche peso obiettivo e data.

- `basale` = `10 × peso + 6,25 × altezza − 5 × età + 5` per un uomo, `− 161` per una donna (Mifflin-St Jeor).
- `minimo` = `basale` arrotondato alla decina. Sostituisce `floorKcal` in §3.3: la base del giorno non scende mai sotto il metabolismo basale.
- `fabbisogno` = `basale × sedentaryFactor` (1,2). Giornata sedentaria apposta: bici e passi si sommano già con il bonus di §3.2 e non devono contare due volte.
- `scartoAlGiorno` = `(peso − peso obiettivo) × kcalPerKg` (7.700) `/ giorni da oggi alla data`. Positivo per chi vuole scendere, negativo per chi vuole salire. Senza peso obiettivo o senza data vale 0.
- `kcalBaseCalcolata` = `max(minimo, fabbisogno − scartoAlGiorno)`, arrotondata alla decina.
- **Piano non raggiungibile.** Se `fabbisogno − scartoAlGiorno < minimo`, la base resta al minimo e l'app lo dice, con la prima data possibile: oggi + `arrotonda per eccesso((peso − peso obiettivo) × kcalPerKg / (fabbisogno − minimo))` giorni. Non si scende sotto il basale per nessun motivo.
- Data già passata o peso obiettivo già raggiunto: scarto 0.
- `baseKcal` usata da tutte le regole = valore scritto a mano dall'utente, se c'è; altrimenti `kcalBaseCalcolata`. Lo stesso per proteine e grassi (§3.4), che erano già calcolati.
- Profilo incompleto (manca sesso, età o altezza): valgono i default della tabella (`baseKcal` 2100, `floorKcal` 1800) e Obiettivi invita a completare il profilo.
- Il motore riceve "oggi" come parametro. Chi ha già una kcal base salvata la tiene come valore personalizzato finché non sceglie "Usa il valore calcolato".

Casi di verifica (oggi = 1 gennaio):

| # | Situazione | Risultato atteso |
|---|---|---|
| AA | Uomo, 27 anni, 180 cm, 100 kg | Basale 1.995, minimo 2.000, fabbisogno 2.394 |
| AB | Come AA, obiettivo 90 kg tra 300 giorni | Scarto 257; kcal base 2.140 |
| AC | Come AA, obiettivo 90 kg tra 100 giorni | Scarto 770: non raggiungibile. Kcal base 2.000; prima data possibile tra 196 giorni |
| AD | Come AA, senza peso obiettivo | Kcal base 2.390 |
| AE | Donna, 30 anni, 165 cm, 65 kg | Basale 1.370 (1.370,25), minimo 1.370, fabbisogno 1.644 |
| AF | Uomo, 25 anni, 175 cm, 60 kg, obiettivo 65 kg tra 200 giorni | Basale 1.574, fabbisogno 1.889, scarto −193: kcal base 2.080 |
| AG | Come AB, con kcal base scritta a mano 2.100 | Kcal base 2.100, minimo 2.000 |
| AH | Profilo senza sesso | Kcal base 2.100, minimo 1.800 |

## 4. Pasti e modello AI

- **Cosa riceve il modello**: solo il testo scritto o dettato dall'utente, la data e l'ora locali (per dedurre la fascia) ed eventualmente la stima precedente con la correzione. Nessun altro dato dell'utente: niente peso, obiettivi, email.
- **Cosa restituisce**: uno o più pasti; per ogni pasto la fascia (colazione, pranzo, cena, spuntino), se l'utente lo ha indicato come pasto libero, e i piatti. Per ogni piatto: nome, quantità, se la quantità è stata ipotizzata, kcal, proteine, carboidrati, grassi, fibre, sale, e una nota breve.
- **Fascia**: quella detta dall'utente ("a pranzo"); se non la dice, si deduce dall'ora. Si può cambiare prima di confermare.
- **Nome e quantità**: il nome è solo il nome del piatto ("Polpette di maiale al sugo"). La quantità è l'elenco degli ingredienti principali con i grammi, come testo libero ("200 g carne di maiale, 10 g pangrattato, 300 g salsa di pomodoro"); per un alimento semplice basta la sua quantità ("1 mela, 180 g"). Nessuna tabella di ingredienti nel database: resta il campo di testo che c'è già.
- **Quantità non dette**: il modello usa porzioni standard di un adulto, le scrive nella quantità e le segna come ipotizzate. Non fa domande.
- **Crudo o cotto**: per pasta, riso, altri cereali e legumi secchi i grammi detti dall'utente si intendono **a crudo**, salvo che dica "cotta", "cotto", "lessa" o "nel piatto". L'interpretazione è sempre scritta nella quantità ("100 g pasta a crudo, 80 g sugo di pomodoro, 5 g olio"), così un errore si vede prima di confermare. Riferimento: "pasta al pomodoro 100 g" vale circa 400-450 kcal, non 110-150.
- **Pasto libero**: se la frase lo dice ("pasto libero: pizza e birra"), il modello lo segnala sul pasto. Il modello riconosce solo che è stato detto: il tetto di kcal e il limite di uno a settimana li applica il motore.
- **Stessa frase, stessa stima**: temperatura 0 e risposta strutturata.
- **Piatti separati**: "anelli di totano e un'insalata di pomodorini" diventano due piatti dello stesso pasto, ciascuno con la sua stima.
- Nulla viene salvato senza conferma dell'utente. Ogni piatto stimato conserva il testo originale.
- **Provider**: intercambiabile dietro `AiProvider`. Il primo è Gemini su **Vertex AI** (Google Cloud), chiamato solo dal server. Modello, progetto e regione sono variabili d'ambiente. In sviluppo si usa un provider finto con risposte fisse.
- **Protezioni**: solo utenti con accesso possono chiamare il modello; massimo 60 stime al giorno per utente (impostazione del server); risposta del modello sempre validata prima di mostrarla.
- **Preferiti**: piatti singoli e pasti interi salvati con i loro numeri, da riaggiungere senza passare dal modello; si eliminano scorrendo. Niente ricettario separato, niente foto.

## 5. Attività e automazioni

Salute e Promemoria di Apple non sono raggiungibili da un server: i dati arrivano da Comandi rapidi su iPhone che chiamano l'app.

### Dati da Salute
- **Cosa manda il Comando rapido.** Un solo comando legge da Salute i passi e la distanza in bici degli ultimi 2 giorni, raggruppati per giorno, e li invia all'app. Parte da solo più volte al giorno; a telefono bloccato Salute non è leggibile e quell'invio semplicemente non riesce, senza avvisi. Verificato su iPhone: il raggruppamento per giorno funziona per passi e bici; le uscite registrate con Fitness arrivano in "Distanza in bici" con i km giusti; a telefono bloccato il comando non mostra errori.
- **Cosa tiene l'app.** Solo le righe di **oggi e di ieri** (fuso `Europe/Rome`): le altre si scartano. Ripetere lo stesso invio non crea doppioni: l'ultimo valore sostituisce il precedente. Un valore mancante o a zero non scrive e non cancella nulla.
- **Passi.** Arrivano solo da Salute: non si inseriscono e non si modificano a mano. Un invio da Salute sostituisce anche un vecchio valore a mano. I vecchi valori a mano restano visibili finché Salute non li sostituisce e si possono solo eliminare.
- **Bici a mano.** I km da Salute non si modificano e non si eliminano. A mano si può aggiungere **un valore per giorno** (km, kcal facoltative), che si **somma** ai km da Salute di quel giorno e non viene mai toccato dagli invii; si modifica e si elimina liberamente. Serve per le uscite non registrate sul telefono. Nel database è una colonna in più, per aggiunta; i valori di bici a mano già presenti diventano la parte a mano del loro giorno.
- **Kcal della bici.** Da Salute arrivano solo i km: le kcal si calcolano con `km × kcalPerKm` (§3.2), perché i Comandi rapidi non leggono gli allenamenti. Per la parte a mano valgono le kcal inserite, se ci sono, altrimenti la stessa formula. Le kcal del giorno sono la somma delle due parti.
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
| 5b | Ritocchi dopo la prova sul telefono: attività in sola lettura e bici a mano, colori dell'anello, pasto libero e ricetta nella proposta AI, regola del crudo, controllo di coerenza, preferiti eliminabili scorrendo, media nella Settimana, segno della variazione di peso |
| 5c | Scheda del piatto unica per aggiunta e modifica, preferiti senza doppioni, colore della linea della media, obiettivi calcolati dal profilo, Impostazioni a sezioni |
| 6 | Testi e grafica: tema solo scuro, stile di §10, nuova navigazione |
| 6b | Grafici |
| 7 | Promemoria (opzionale) |

## 9. Fuori dalla prima versione

Sfida mattutina e programmi di allenamento, gestione inviti nell'app (gli accessi si gestiscono da Supabase), attività diverse da bici e passi, app nativa, foto del piatto, Strava, velocità media e durata delle uscite, obiettivo del giorno modificabile a mano, nutrienti modificabili giorno per giorno, email del guardiano, app a pagamento per leggere Salute, passi inseriti a mano, più uscite in bici a mano nello stesso giorno, soglie dell'anello modificabili da Impostazioni, livello di attività nel profilo (l'attività conta già con bici e passi), piani sotto il metabolismo basale.

## 10. Stile (dalla fase 6)

Riferimento visivo: `docs/design/bozza-fase-6.html` (si apre nel browser) e `docs/design/bozza-fase-6.png`. La bozza fissa direzione, colori, forme e gerarchie di Oggi, Settimana, scheda del piatto e Impostazioni; non è codice da copiare e i suoi numeri sono d'esempio. Dove la bozza e questo paragrafo non dicono nulla, si sceglie la soluzione più vicina all'app Fitness di Apple e la si scrive nel diario.

### 10.1 Principi
- **Solo tema scuro.** Il tema chiaro non esiste più: niente `prefers-color-scheme`, niente varianti chiare, screenshot solo scuri.
- **Nero pieno** come sfondo, schede opache senza bordo con angoli ampi. Nessuna ombra sulle schede.
- **Vetro solo in tre punti:** barra di navigazione, tasto +, intestazione che resta in alto quando si scorre. Tutto il resto è opaco. La sfocatura non deve mai essere l'unica cosa che rende leggibile un testo: sotto c'è sempre un colore di fondo semitrasparente.
- **Un colore ha un solo significato**, ovunque (§10.2).
- **Numeri** in carattere arrotondato di sistema (`ui-rounded`, con ricaduta sul font di sistema), peso medio, non grassetto; unità piccola, in maiuscolo, accanto al numero ("12,4 KM", "39 KCAL"). Titoli di schermata grandi e in grassetto.
- Aree toccabili di almeno 44 px. Rispetto delle aree sicure dell'iPhone. Animazioni brevi e sobrie, disattivate con `prefers-reduced-motion`.

### 10.2 Colori

| Nome | Valore | Uso, e solo questo |
|---|---|---|
| Sfondo | `#000000` | Fondo dell'app |
| Scheda | `#151517` | Schede |
| Tessera | `#222224` | Elementi dentro una scheda o un pannello: piatti, elenchi, tasti a pillola |
| Pannello | `#111113` | Fondo dei pannelli che salgono |
| Testo | `#f5f5f7` | Testo principale |
| Testo secondario | `#98989f` | Etichette, unità, note |
| Separatore | `#323234` | Linee tra le righe di un elenco |
| Comando | `#a6ff00` | Tutto ciò che si tocca per agire (testo dei tasti, voce attiva della barra, tasto +, "Salva") e l'anello della giornata **in corso** |
| In obiettivo | `#0a84ff` | Giudizio positivo: anello raggiunto, nutriente nel verde di §3.5, saldo positivo, peso che si avvicina |
| Attenzione | `#ffd60a` | Il "giallo" di §3.5 |
| Fuori | `#ff453a` | Il "rosso" di §3.5; azioni distruttive ("Elimina", "Esci") |
| Sotto | `#8e8e93` | Giorno **concluso** rimasto sotto `ringGreenBelow` |
| Passi | `#a78bfa` | Numeri e grafici dei passi |
| Bici | `#ff9f0a` | Numeri e grafici della bici |
| Linea obiettivo | `#fa114f` | Solo la linea dell'obiettivo nei grafici |
| Linea media | `#f5f5f7` | Solo la linea tratteggiata della media |

I colori sono variabili di stile con questi nomi di ruolo, definite in un solo file. Nessun colore scritto a mano nei componenti.

**Corrispondenza con le regole.** Il motore non cambia: i suoi stati restano quelli di §3.5. Cambia solo il colore con cui si mostrano: "verde" → In obiettivo (blu); "giallo" → Attenzione; "rosso" → Fuori; "accento" → Comando (lime) se il giorno è oggi o futuro, Sotto (grigio) se il giorno è passato. Passi e bici non esprimono mai un giudizio: hanno solo il loro colore.

### 10.3 Forme e componenti
Pochi componenti condivisi, usati ovunque:
- **Scheda**: raggio 24 px, margine interno 16 px. Titolo in alto a sinistra; se la scheda si apre, una freccia in un cerchietto grigio in alto a destra.
- **Tessera**: raggio 16 px, dentro una scheda. Ogni piatto di un pasto è una tessera separata (nome, quantità sotto in piccolo, kcal a destra).
- **Elenco raggruppato**: righe in un contenitore con raggio 22 px, separate da una linea sottile. Riga bianca con valore grigio e freccia a destra se apre una pagina; riga nel colore Comando, senza freccia, se esegue un'azione; riga nel colore Fuori se è distruttiva.
- **Tasto a pillola**: largo quanto il contenitore, fondo Tessera, testo nel colore Comando. Un solo tasto pieno (fondo Comando, testo nero) per pannello: l'azione principale.
- **Intestazione dei pannelli**: X in un cerchio a sinistra, titolo al centro, azione principale a destra (per esempio "Salva", piena). Sempre visibile.
- **Selettore a segmenti** (AI | Manuale): capsula con la voce attiva più chiara.
- **Numero con unità**: il componente unico per tutti i numeri in evidenza.

### 10.4 Navigazione
- **Barra in basso**: capsula sospesa in vetro, tre voci con icona e nome (Oggi, Settimana, Grafici). La voce attiva sta in una pillola più scura, nel colore Comando.
- **Tasto +**: cerchio di 52 px nel colore Comando al 62% di opacità, opaco (senza sfumature né alone), sospeso in basso a destra **sopra** la barra e staccato da essa di almeno 12 px. In fondo a ogni schermata c'è spazio vuoto sufficiente perché, a fine pagina, il + e la barra non coprano contenuto.
- **Impostazioni**: non sono più nella barra. Si aprono da un tasto a ingranaggio in alto a destra in Oggi, come pannello con la X. Dentro, l'elenco a sezioni di §2.
- **Icone**: disegnate nel repository come SVG a tratto, nello stile delle icone di sistema Apple; nessuna libreria di icone salvo motivo scritto nel diario.

### 10.5 Schermate
- **Oggi**: scheda "Calorie" con anello a sinistra e, a destra, "Rimaste" (o "Oltre") con il numero grande e sotto "2.061 di 2.100". Griglia dei nutrienti a due colonne: nome, numero colorato secondo lo stato, obiettivo in grigio, barretta dello stesso colore. Pasti: una scheda per pasto con i piatti come tessere e "+ Aggiungi piatto". Passi e Bici: due schede affiancate con i loro colori.
- **Settimana**: scheda "Calorie" con le sette barre (angoli arrotondati, colore secondo lo stato del giorno), griglia orizzontale puntinata, **linea dell'obiettivo continua** da lunedì a domenica, a gradini dove l'obiettivo cambia da un giorno all'altro, e linea della media tratteggiata; legenda in alto a destra. Sotto, schede a due colonne: Saldo, Media, Passi e Bici (ciascuna con un mini grafico a barre sottili dei sette giorni su griglia puntinata), Peso, Pasto libero.
- **Scheda del piatto, proposta dell'AI, preferiti, pesata, bici**: pannelli con l'intestazione di §10.3, campi in elenchi raggruppati.
- **Grafici**: resta com'è nei contenuti; prende solo colori, schede e caratteri nuovi.

### 10.6 Testi
I nomi di comandi, titoli ed etichette sono in `docs/TESTI.md`, tabella "com'è → come diventa", approvata dall'utente. Regole: un comando dice esattamente cosa fa ("Aggiungi uscita in bici", non "Bici a mano"); niente gergo interno; niente paragrafi di spiegazione; maiuscola solo a inizio frase.
