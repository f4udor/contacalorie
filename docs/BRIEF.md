# Personal Health: brief di prodotto

## 1. Scopo

App personale per tracciare dieta ipocalorica e attività fisica. Pochi utenti (Mauro e chi aggiunge lui), ciascuno con i propri dati, su iPhone (web app installata sulla Home) e computer, con gli stessi dati. Deve essere semplice, solida e ampliabile per moduli.

## 2. Schermate

Navigazione in basso: **Oggi, Trend** (dalla fase 9; prima Oggi, Settimana, Grafici). Impostazioni dietro l'ingranaggio (§10.4).

### Oggi
1. Data con frecce per cambiare giorno e tasto "Oggi".
2. Anello delle kcal: rimaste al centro; sotto, la riga di composizione dell'obiettivo ("Base 2.100 · bici +400 · passi +75 · recupero −100"). Dalla fase 8 la riga c'è sempre: nei giorni senza bici, passi oltre soglia o recupero dice solo "Base 2.100". Così la scheda ha sempre la stessa altezza.
3. Griglia di schede dei nutrienti: proteine, carboidrati, grassi, fibre, sale. Ogni scheda: nome, "assunto su obiettivo", barretta colorata a semaforo.
4. Pasti del giorno: Colazione, Pranzo, Cena, Spuntino. Ogni pasto è composto da uno o più piatti e mostra il totale di kcal e macro, con i piatti elencati sotto ed etichetta "libero" se lo è. Ogni piatto si modifica o elimina; ogni pasto ha il suo "Aggiungi piatto". Scorrendo un piatto verso sinistra compaiono "Preferiti" e il cestino; il cestino elimina subito, senza conferma. Se il piatto è già tra i preferiti (stesso nome e stessa quantità, senza badare a maiuscole e spazi), al posto di "Preferiti" c'è "Rimuovi dai preferiti": un piatto non finisce mai due volte tra i preferiti.
5. Attività: passi e bici (km, kcal), con la fonte ("da Salute" o "manuale"). I passi sono in sola lettura: toccarli non apre nulla. Della bici si tocca solo la parte inserita a mano (§5).
6. Avviso in cima se i dati da Salute non arrivano da più di un giorno (§5).
7. Pulsante **+** sempre visibile.

### Pannello Aggiungi (dal +)
- In cima: un campo di testo "Cosa hai mangiato?". L'utente scrive o detta con il microfono della tastiera dell'iPhone, il modello AI restituisce uno o più pasti con i loro piatti stimati, l'utente conferma, corregge i numeri a mano oppure invia una correzione a voce o testo ("il totano era di più") che aggiorna la stima.
- **Una sola scheda per aggiungere e per modificare un piatto**, con gli stessi comandi nello stesso posto. In alto: "Chiudi" a sinistra, il titolo, "Salva" a destra, sempre visibili anche con la tastiera aperta e con il contenuto che scorre; nessun pulsante di salvataggio in fondo.
- Sotto il titolo lo stesso selettore **AI | Manuale**: in aggiunta si apre su AI, in modifica su Manuale. In modifica, AI mostra il campo per correggere a parole la stima del piatto ("era di più"). In Manuale c'è sempre il pulsante "Stima con l'AI", che riempie kcal e nutrienti anche quando i campi hanno già dei numeri; l'utente vede i nuovi numeri e salva. Come è fatta la scheda in Manuale: §4.2.
- La proposta dell'AI mostra ogni piatto su una riga (nome, quantità, kcal); toccandola si aprono i numeri da correggere. Ogni pasto proposto ha il suo interruttore "Pasto libero", disattivato se la settimana ne ha già uno; se l'utente lo ha detto nella frase arriva già acceso e si può spegnere. Un piatto la cui stima non supera il controllo di coerenza (§3.7) mostra un avviso breve.
- "Aggiungi piatto" sotto un pasto apre lo stesso pannello, su AI, con la fascia già fissata.
- **Pasto libero, dove si segna** (dalla fase 8): solo nella proposta dell'AI (interruttore sul pasto) e nel pannello Pasto libero della Settimana / Trend ("Segna"). La scheda del piatto non ha più l'interruttore, né in aggiunta né in modifica.
- **Preferiti** (dalla fase 8): un solo tasto "Preferiti", quello nel campo "Cosa hai mangiato?" (§4.1). La riga "Preferiti" sotto il campo non c'è più. Nell'elenco si scorre una riga verso sinistra per "Modifica" (solo piatti) ed "Elimina" (§4.1).
- Sotto il campo: "Pesata" e "Uscita in bici". I passi non si inseriscono a mano.

### Settimana (lunedì-domenica; dalla fase 9 è la vista "Settimana" di Trend)
- Sette barre delle kcal mangiate con la linea dell'obiettivo di ogni giorno e una linea tratteggiata orizzontale alla media kcal della settimana, con etichetta ("media 2.040"), distinta a colpo d'occhio dalla linea dell'obiettivo.
- Saldo della settimana, media kcal (§3.8, lo stesso numero della linea), medie dei nutrienti, km in bici, passi medi, pasto libero usato o no.
- Peso: ultima pesata della settimana e differenza in kg con la pesata precedente (o con il peso di partenza del profilo), sempre con il segno e un decimale ("−0,4 kg", "+0,3 kg", mai "0 kg" per una variazione di qualche etto), verde se ci si avvicina al peso obiettivo e rosso se ci si allontana. La scheda c'è sempre: senza pesate nella settimana dice "Nessuna pesata". Il peso del profilo è il peso di partenza e le pesate non lo sovrascrivono; consigliata una pesata a settimana, stesso giorno, al mattino.
- Le schede Peso, Bici, Passi e Pasto libero si toccano e aprono un pannello: pesate da eliminare o aggiungere; giorni di bici, dove si aggiunge, modifica o elimina solo la parte inserita a mano; giorni di passi, in sola lettura salvo i vecchi valori a mano, che si possono solo eliminare; pasto libero da togliere (il pasto resta, torna normale) o da scegliere tra i pasti della settimana.

### Trend (dalla fase 9)
Sostituisce Settimana e Grafici: la schermata Grafici e la sua voce nella barra spariscono.
- **Selettore Settimana | Mese | Anno** sotto l'intestazione, a segmenti come AI | Manuale. Si apre sempre su Settimana. Settimana = lunedì-domenica; Mese e Anno = di calendario. Intervalli personalizzati: no (idee future).
- **Intestazione**: titolo "Settimana", il nome del mese ("Ottobre") o l'anno ("2026"); sopra in piccolo l'intervallo ("5 gen – 11 gen", "ottobre 2026", "2026"). Frecce e ritorno al presente si spostano dell'unità scelta; il presente è il periodo che contiene oggi. Cambiando unità si resta nel periodo che contiene il giorno di riferimento attuale (dalla settimana del 14 ottobre a Mese si va a ottobre).
- **Calorie**: in Settimana com'è ora. In Mese una barra per giorno con gli stessi colori, la linea dell'obiettivo a gradini e la linea della media; sotto, le etichette 1, 8, 15, 22, 29. In Anno una barra per mese (§3.10), etichette G F M A M G L A S O N D. La legenda resta "obiettivo" e "media …".
- **Tocco su una barra**: il primo tocco mostra il numero con una freccia ("2.080 ›"); tocco sul numero: in Settimana e Mese apre quel giorno in Oggi, in Anno passa a Mese su quel mese. Tocco altrove: il numero sparisce. Giorni o mesi senza pasti, e giorni futuri: niente.
- **Schede**, nello stesso ordine e posto in ogni vista:

| Scheda | Settimana | Mese e Anno |
|---|---|---|
| Saldo / Giorni nel budget | Saldo come ora (§3.3) | "Giorni nel budget", "18 su 24" e sotto "6 oltre" (§3.10) |
| Media | media kcal (§3.8) | media kcal sul periodo (§3.10) |
| Passi | media al giorno, mini grafico dei 7 giorni | media al giorno; mini grafico per giorno (Mese) o per mese (Anno) |
| Bici | km della settimana | km del periodo; mini grafico per giorno o per mese |
| Peso | ultima pesata e variazione | ultima pesata del periodo e variazione (§3.10), con una piccola linea delle pesate del periodo |
| Pasto libero | usato o no | "N usati" |
| Medie dei nutrienti | come ora | sui giorni con pasti del periodo |

- In Mese e Anno le schede Passi, Bici e Pasto libero non si toccano (niente freccia: i loro pannelli sono settimanali). Peso si tocca e apre lo stesso pannello di sempre.
- Le altezze delle schede e del grafico sono le stesse nelle tre viste e con o senza dati (§10.3).

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

**Saldo mostrato in Settimana.** È lo stesso saldo della regola (con il tetto al margine), calcolato sui soli **giorni conclusi**: i giorni con pasti precedenti a oggi. Oggi è in corso e non conta, come per la media (§3.8): i pasti ancora da fare sembrerebbero margine. Per una settimana passata contano tutti i giorni con pasti. Senza giorni conclusi con pasti il saldo non c'è e la scheda mostra un trattino. La regola dell'obiettivo qui sopra non cambia: usava già solo i giorni precedenti.

Testo sotto il numero (dalla fase 8): "di margine" se il saldo è positivo, "da recuperare" se è negativo, "in pari" se è zero; con il trattino nessuna riga, ma lo spazio resta. Il trattino ha la stessa misura e la stessa altezza di quello della scheda Media.

Casi di verifica (base 2.100, nessuna attività, `creditCap` 300):

| Caso | Situazione | Saldo mostrato |
|---|---|---|
| AJ | Lunedì 1.900 kcal; oggi è martedì, mangiate finora 600 | +200 (non 300) |
| AK | Oggi è lunedì, mangiate finora 600 | nessuno (trattino) |
| AL | Lunedì 2.500 kcal; oggi è martedì senza pasti | −400 |
| AM | Settimana passata: lunedì 1.900, domenica 2.000, altri giorni vuoti | +300 (tetto) |

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

### 3.10 Numeri di Trend: mese e anno (dalla fase 9)
Funzioni pure nel motore. Valgono le regole già scritte, applicate a un periodo più lungo; nessuna regola nuova sugli obiettivi.

- **Giorni conclusi**: i giorni con almeno un pasto precedenti a oggi (per un periodo passato, tutti i giorni con pasti). Oggi non conta mai, come per la media (§3.8).
- **Obiettivo di ogni giorno**: quello di §3.3, calcolato dentro la propria settimana (lunedì-domenica), anche quando la settimana è a cavallo di due mesi.
- **Giorni nel budget** (Mese e Anno): giorni conclusi con `d ≤ ringGreenAbove`, dove `d` = kcal contate nel budget (§3.1) − obiettivo del giorno. Sono i giorni in blu o in grigio: nessun recupero scatta dopo di loro. Gli altri giorni conclusi sono "oltre". La scheda mostra "N su M" (M = giorni conclusi) e sotto "K oltre". Senza giorni conclusi: trattino.
- **Media kcal** del periodo: media delle kcal mangiate (reali) nei giorni conclusi. In Anno è la media su tutti i giorni dell'anno, non la media delle medie mensili.
- **Barre di Anno**: una per mese. Altezza = media delle kcal mangiate nei giorni conclusi del mese; linea dell'obiettivo = media degli obiettivi degli stessi giorni. Colore con la tabella dell'anello (§3.5) applicata a `d` = media delle kcal contate − media degli obiettivi; "accento" diventa Comando per il mese che contiene oggi e Sotto per gli altri (§10.2). Mese senza giorni conclusi: nessuna barra.
- **Passi**: media dei valori maggiori di zero del periodo. **Bici**: somma dei km del periodo (Salute + a mano). Mini grafici: in Mese un valore per giorno; in Anno la media dei passi e i km totali di ogni mese.
- **Peso**: ultima pesata del periodo e differenza con l'ultima pesata precedente all'inizio del periodo, o con il peso di partenza del profilo se non ce n'è; formato e colori come in Settimana (§2). Senza pesate nel periodo: "Nessuna pesata".
- **Pasto libero**: numero di pasti liberi con data nel periodo.
- **Nutrienti medi**: come in Settimana (giorni con pasti del periodo).

Casi di verifica (base 2.100, nessuna attività, nessun recupero salvo dove detto; oggi = giovedì 15 ottobre 2026):

| Caso | Situazione | Risultato atteso |
|---|---|---|
| TA | Ottobre: 1 ott 2.000, 2 ott 2.140, 3 ott 2.200; oggi 600 | Media 2.113; giorni nel budget 2 su 3, 1 oltre |
| TB | Un giorno concluso a 2.150, un altro a 2.151 (obiettivo 2.100, nessun recupero) | Il primo nel budget, il secondo oltre |
| TC | Giorno concluso con pranzo libero da 2.250 e altri piatti per 1.000 | Nel budget (contate 1.800); la media usa 3.250 |
| TD | Anno 2026: a gennaio due giorni in settimane diverse, 2.000 e 2.200; febbraio senza pasti | Barra di gennaio 2.100, linea 2.100, colore In obiettivo; nessuna barra a febbraio |
| TE | Anno 2026: gennaio un giorno a 2.000; marzo tre giorni a 2.400 | Media dell'anno 2.300 (non 2.200) |
| TF | Pesate 31 agosto 95,0 kg, 10 settembre 94,6, 28 settembre 94,1; vista Mese di settembre | 94,1 kg, "−0,9 kg" |
| TG | Pasti liberi il 3 e il 17 ottobre | Ottobre: "2 usati" |
| TH | Ottobre: passi 8.000, 0, 10.000 in tre giorni; bici 20,4 km e 5,2 km | Passi media 9.000; bici 25,6 km |
| TI | Mese senza pasti | Giorni nel budget e media col trattino, grafico vuoto alto quanto quello pieno |

## 4. Pasti e modello AI

- **Cosa riceve il modello**: solo il testo scritto o dettato dall'utente, la data e l'ora locali (per dedurre la fascia) ed eventualmente la stima precedente con la correzione. Per "Stima con l'AI" nella scheda del piatto il testo è composto da nome, peso e ingredienti scritti dall'utente (§4.2). Se nel testo ci sono preferiti inseriti come etichetta (§4.1), il testo contiene il loro nome e un riferimento; i loro numeri non vengono mandati. Nessun altro dato dell'utente: niente peso, obiettivi, email.
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

### 4.1 Preferiti nella stima e peso dei piatti (dalla fase 7)

Scopo: un piatto che l'utente conosce meglio del modello (per esempio un hummus fatto in casa, molto più leggero di quello comune) si scrive una volta, si salva tra i preferiti e da lì in poi si usa nella frase con i suoi numeri, in qualunque quantità.

- **Peso del piatto.** Ogni piatto ha un **peso in grammi** facoltativo (numero intero). Il modello lo restituisce per ogni piatto che stima: la somma dei grammi scritti nella quantità (per pasta, riso, cereali e legumi secchi, i grammi a crudo). Nel piatto a mano è un campo "Peso (g)" facoltativo. I piatti già salvati non hanno peso.
- **Preferito con peso.** Salvando un piatto nei preferiti si salva anche il suo peso. Kcal e nutrienti restano quelli del piatto salvato: le proporzioni si ricavano dal rapporto con il peso. Un preferito senza peso funziona a porzioni, come oggi.
- **Etichetta nel campo dell'AI.** Accanto al campo "Cosa hai mangiato?" un tasto "Preferiti" apre l'elenco dei preferiti (con ricerca): dalla fase 8 pasti e piatti, in due gruppi. È l'unico modo di riaggiungere un preferito (la riga "Preferiti" sotto il campo non c'è più). Scegliendone uno, nel testo compare un'**etichetta** con il nome del piatto, che si cancella come una parola. Dopo l'etichetta l'utente scrive la quantità ("150 g", "2 porzioni", "mezza porzione") e il resto della frase come sempre. Si possono inserire più etichette.
- **Cosa fa il modello con un'etichetta.** Non stima il piatto: lo mette nel pasto giusto e restituisce solo la quantità detta (grammi oppure porzioni) e se è stata detta o no. Nome, numeri e quantità del piatto li scrive l'app dal preferito.
- **Calcolo** (lo fa l'app, mai il modello). Con `r` = rapporto:
  - preferito con peso e grammi detti: `r = grammi detti / peso del preferito`;
  - porzioni dette: `r = porzioni`; il peso del piatto diventa `peso del preferito × porzioni`, se c'è;
  - nessuna quantità detta: `r = 1` e la quantità è segnata come ipotizzata;
  - preferito senza peso ma grammi detti: dalla fase 8 nel piatto compare la domanda "Quanto pesava la porzione salvata?" con un campo in grammi e "Salta". Finché non risponde, `r = 1` e la quantità è "1 porzione", senza avviso giallo. Se scrive `w` grammi: `r = grammi detti / w`, numeri e peso del piatto si ricalcolano subito e, confermando la proposta, il preferito prende il peso `w`. "Salta" toglie la domanda e lascia `r = 1`.
  - kcal e nutrienti = valori del preferito × `r`; kcal arrotondate all'intero, nutrienti a un decimale. La quantità scritta nel piatto diventa "150 g" oppure "2 porzioni".
- **Nella proposta** il piatto da un'etichetta mostra "dai tuoi preferiti" e non passa dal controllo di coerenza (§3.7). Si corregge come gli altri piatti.
- **Cambiare quantità senza AI.** Nella scheda del piatto, se il piatto aveva un peso quando la scheda è stata aperta, cambiare il peso ricalcola kcal e nutrienti in proporzione partendo dai valori dell'apertura; nessuna chiamata al modello. Dalla fase 8 la riga "Porzioni" non c'è più (§4.2): su un piatto senza peso, scrivere il peso lo registra e basta.
- **Solo etichette, niente AI** (dalla fase 8). Se il testo contiene solo etichette e quantità semplici ("150 g", "150g", "2 porzioni", "×2", "x2", "mezza porzione", "una porzione"), "Stima" non chiama il modello: l'app compone la proposta da sola con il calcolo qui sopra. La fascia è quella fissata, se c'è; altrimenti dall'ora locale: 05:00-10:59 colazione, 11:00-14:59 pranzo, 15:00-18:29 spuntino, 18:30-04:59 cena. Si cambia nella proposta come sempre. Basta una parola in più ("a pranzo", "e una mela") perché la frase vada al modello come oggi.
- **Pasto preferito come etichetta** (dalla fase 8). Scegliendo un pasto, nel testo compare un'etichetta con il nome del pasto, con un bordo nel colore Comando per distinguerla da quella di un piatto. Nella proposta l'etichetta diventa tutti i piatti del pasto, con i numeri salvati; una quantità detta dopo un pasto si ignora. Al modello va solo nome e riferimento, come per i piatti; il modello dice solo in che pasto va.
- **Peso chiesto al salvataggio** (dalla fase 8). Salvando un piatto senza peso nei preferiti (dallo scorrimento in Oggi o dalla scheda del piatto) sale un pannello piccolo "Salva nei preferiti" con il nome del piatto e il campo "Peso" in grammi, facoltativo; "Salva" funziona anche con il campo vuoto. Se il piatto ha già un peso, si salva subito come prima. Vale solo per i piatti, non per i pasti.
- **Modificare un preferito** (dalla fase 8). Nell'elenco dei preferiti, scorrendo una riga verso sinistra compaiono due tessere: "Modifica" (solo per i piatti) ed "Elimina" (subito, senza conferma). "Modifica" apre la scheda del piatto (§4.2) con titolo "Modifica preferito", senza la riga Pasto e senza "Salva nei preferiti" ed "Elimina piatto"; "Salva" aggiorna quel preferito (nome, ingredienti, peso, numeri). I piatti già registrati nei giorni passati non cambiano. Se dopo la modifica nome e ingredienti coincidono con un altro preferito, restano due righe, che si eliminano scorrendo.
- **Preferiti senza peso.** Oltre alla domanda nella proposta e al salvataggio, si completano con "Modifica".

Casi di verifica:

| Caso | Situazione | Risultato |
|---|---|---|
| AN | Preferito "Hummus fatto in casa": peso 150 g, 150 kcal, proteine 7,5 g. Frase con etichetta e "100 g" | 100 kcal, proteine 5,0 g, peso 100 g, quantità "100 g" |
| AO | Come AN con "220 g" | 220 kcal, proteine 11,0 g |
| AP | Come AN con "2 porzioni" | 300 kcal, proteine 15,0 g, peso 300 g |
| AQ | Come AN senza quantità | 150 kcal, peso 150 g, quantità ipotizzata |
| AR | Preferito "Caffè con zucchero" senza peso, 20 kcal. Frase con etichetta e "×2" | 40 kcal, quantità "2 porzioni" |
| AS | Come AR con "100 g" (dalla fase 8) | 20 kcal, quantità "1 porzione", domanda "Quanto pesava la porzione salvata?", nessun avviso giallo |
| AT | Piatto di 200 g, 300 kcal, carboidrati 40,0 g; nella scheda il peso diventa 250 g | 375 kcal, carboidrati 50,0 g |
| AU | Motore: valori 420 kcal, grassi 13,3 g, rapporto 1,5 (la riga Porzioni non c'è più nella scheda dalla fase 8; il calcolo resta per "2 porzioni" detto nella frase) | 630 kcal, grassi 20,0 g (19,95 arrotondato) |
| AV | Preferito "Torta della nonna" senza peso, 300 kcal. Frase con etichetta e "120 g"; alla domanda risponde 80 | 450 kcal, peso 120 g, quantità "120 g"; dopo la conferma il preferito ha peso 80 g |
| AW | Come AN, testo solo "[Hummus fatto in casa] 100g" alle 13:10, nessuna fascia fissata | Nessuna chiamata al modello; pranzo, 100 kcal, proteine 5,0 g |
| AX | Testo "[Colazione solita] [Hummus fatto in casa] 2 porzioni" alle 08:00 | Nessuna chiamata al modello; colazione con i piatti del pasto salvato più l'hummus a 300 kcal |
| AY | Testo "[Hummus fatto in casa] 100 g e una mela" | Va al modello come prima |

### 4.2 Scheda del piatto in Manuale (dalla fase 8)

Scopo: si scrive il nome e il peso, l'AI stima per quel peso. Niente campi che non servono.

- **Ordine dei campi**: Nome, Peso (g), Ingredienti; poi "Stima con l'AI"; poi Calorie, Proteine, Carboidrati, Grassi, Fibre, Sale; poi Pasto (solo se la fascia non è già fissata); in modifica, in fondo, "Salva nei preferiti" ed "Elimina piatto".
- **Ingredienti** è il nuovo nome del campo "Quantità" (testo libero, facoltativo, a più righe), in tutta l'app: scheda, proposta aperta, esportazione CSV. Nel database la colonna resta quella che c'è. Nelle righe dei piatti in Oggi e nella proposta chiusa il testo sotto il nome non cambia.
- **Peso (g)** facoltativo, intero, come oggi (§4.1).
- **"Stima con l'AI"** manda al modello un testo composto da nome, peso (se c'è, "150 g") e ingredienti (se ci sono), con la stessa protezione di oggi (limite giornaliero, risposta validata). Se c'è il peso, il prompt chiede di stimare per quel peso totale e il peso restituito è quello scritto. Riempie i numeri anche se ci sono già; la riga sotto il tasto dice "Stimati dall'AI per 150 g" (o senza peso: "Stimati dall'AI: controlla i numeri").
- **Porzioni**: la riga non c'è più, né in aggiunta né in modifica.
- **Pasto libero**: l'interruttore non c'è più nella scheda del piatto (§2).
- **Pasto**: in aggiunta con la fascia fissata ("Aggiungi a pranzo") la riga non c'è; negli altri casi resta.
- Il resto della scheda non cambia: intestazione con X, titolo e "Salva", selettore AI | Manuale, comandi fermi.

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
- **Doppio conteggio.** Se due app scrivono la stessa uscita in Salute (per esempio Strava e l'iPhone), i km risultano doppi. Rimedio verificato sul telefono: nel Comando rapido la distanza in bici si legge con il filtro "Sorgente è" sull'app con cui si registrano le uscite (per Mauro: Strava). Vale per ogni utente con la sua app; `docs/COLLEGA-SALUTE.md` lo spiega.

### Rimandati
- **Ingresso pasto**: testo dettato a Siri che crea una stima in attesa di conferma.
- **Ingresso promemoria** (modulo opzionale, ultima fase): restituisce i promemoria da creare, già scritti, una sola volta per giorno.

## 6. Sfida mattutina

Rimossa dall'app nella fase 4. Le sue tabelle restano nel database, inutilizzate, perché il database cresce solo per aggiunte.

## 7. Dati

Login con email e codice di 6 cifre ricevuto per email, senza password. Niente link magico: su iPhone aprirebbe Safari e non l'app installata sulla Home. Ogni riga appartiene a un utente e nessuno può leggere righe altrui.

Tabelle previste: impostazioni, pasti, preferiti, attività giornaliera, pesate, piani della sfida, esercizi del piano, registro giornaliero della sfida, token degli ingressi, registro delle chiamate agli ingressi.

## 8. Fasi

Storia fino alla fase 9. Dal 21 ottobre 2026 ogni lavoro è un'issue di GitHub (`docs/METODO.md`); task e report delle fasi sono in `docs/archivio/`.

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
| 6b | Ritocchi dopo la prova sul telefono: pannelli ad altezza stabile, comandi che non si spostano, difetti grafici della fase 6, screenshot mancanti |
| 7 | Preferiti nella stima: peso dei piatti, etichette dei preferiti nel campo dell'AI, quantità ricalcolata senza AI (§4.1) |
| 8 | Ritocchi dei flussi: scheda del piatto (nome, peso, ingredienti; via Porzioni e Pasto libero), peso dei preferiti chiesto, modifica dei preferiti, un solo tasto Preferiti, testo del Saldo, riga dell'obiettivo sempre visibile |
| 9 | Trend: Settimana, Mese e Anno al posto di Settimana e Grafici (§2, §3.10) |
| 7b | Tabella degli ingredienti con valori ufficiali, ingredienti uno per uno (fonte da decidere) |
| 7c | Prodotti di marca da Open Food Facts |
| da decidere | Promemoria (opzionale, tra le idee future) |

## 9. Fuori dalla prima versione

Sfida mattutina e programmi di allenamento, gestione inviti nell'app (gli accessi si gestiscono da Supabase), attività diverse da bici e passi, app nativa, foto del piatto, collegamento diretto all'API di Strava (i km arrivano comunque tramite Salute), velocità media e durata delle uscite, obiettivo del giorno modificabile a mano, nutrienti modificabili giorno per giorno, email del guardiano, app a pagamento per leggere Salute, passi inseriti a mano, più uscite in bici a mano nello stesso giorno, soglie dell'anello modificabili da Impostazioni, livello di attività nel profilo (l'attività conta già con bici e passi), piani sotto il metabolismo basale.

## 10. Stile (dalla fase 6)

Riferimento visivo: `docs/design/bozza-fase-6.html` (si apre nel browser) e le immagini `docs/design/bozza-*.png`: schermate principali, pannelli aperti dalla Settimana, pannelli aperti dal tasto +, Collegamenti. La bozza fissa direzione, colori, forme e gerarchie; non è codice da copiare e i suoi numeri sono d'esempio. Dove la bozza e questo paragrafo non dicono nulla, si sceglie la soluzione più vicina all'app Fitness di Apple e la si scrive nel diario.

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
- **Comandi fermi**: un comando non cambia posto quando cambia il contenuto. Vale per frecce, ritorno al presente, X, selettori e tasti pieni, passando da un giorno o da una settimana all'altra e tra stato pieno e vuoto.
  - Un pannello con le frecce delle settimane ha altezza fissa, uguale per ogni settimana: la stessa con sette giorni di dati e con nessuno. Se l'elenco non ci sta, scorre dentro il pannello; intestazione e frecce restano ferme.
  - Numero grande e grafico occupano sempre lo stesso spazio: senza dati, trattino al posto del numero e griglia vuota al posto delle barre, alte quanto quelle piene.
  - Nelle schede di Oggi e Settimana uno stato vuoto è alto quanto quello pieno.

### 10.4 Navigazione
- **Barra in basso**: capsula sospesa in vetro, voci con icona e nome. Dalla fase 9 le voci sono due, Oggi e Trend (icona del grafico a barre); prima erano tre (Oggi, Settimana, Grafici). La voce attiva sta in una pillola più scura, nel colore Comando.
- **Tasto +**: cerchio di 52 px nel colore Comando al 62% di opacità, opaco (senza sfumature né alone), sospeso in basso a destra **sopra** la barra e staccato da essa di almeno 12 px. In fondo a ogni schermata c'è spazio vuoto sufficiente perché, a fine pagina, il + e la barra non coprano contenuto.
- **Impostazioni**: non sono più nella barra. Si aprono da un tasto a ingranaggio in alto a destra, presente sia in Oggi sia in Settimana, come pannello con la X. Dentro, l'elenco a sezioni di §2.
- **Intestazione di Oggi e Settimana**: a sinistra la data in piccolo e sotto il titolo; a destra, su una riga, quattro tasti tondi: freccia indietro, **ritorno al presente**, freccia avanti, ingranaggio. Il tasto di ritorno è un'icona (cerchio con un punto al centro) tra le due frecce: nel colore Comando quando si guarda un altro giorno o un'altra settimana, grigio e disattivato sul presente; resta sempre al suo posto, così le frecce non si spostano. Nessuna scritta "Oggi" o "Questa settimana". Titolo e tasti stanno su una riga anche a 375 px: se serve si riduce il titolo, mai a capo e mai tasti tagliati. I tasti possono apparire più piccoli di 44 px ma l'area toccabile resta di 44 px. Nei pannelli con le frecce delle settimane lo stesso tasto sta tra le due frecce.
- **Icone**: disegnate nel repository come SVG a tratto, nello stile delle icone di sistema Apple; nessuna libreria di icone salvo motivo scritto nel diario.

### 10.5 Schermate
- **Oggi**: scheda "Calorie" con anello a sinistra e, a destra, "Rimaste" (o "Oltre") con il numero grande e sotto "2.061 di 2.100". Griglia dei nutrienti a due colonne: nome, numero colorato secondo lo stato, obiettivo in grigio, barretta dello stesso colore. Pasti: una scheda per pasto con i piatti come tessere e "+ Aggiungi piatto". Passi e Bici: due schede affiancate con i loro colori.
- **Settimana**: scheda "Calorie" con le sette barre (angoli arrotondati, colore secondo lo stato del giorno), griglia orizzontale puntinata, **linea dell'obiettivo continua** da lunedì a domenica, a gradini dove l'obiettivo cambia da un giorno all'altro, e linea della media tratteggiata; legenda in alto a destra. Sotto, schede a due colonne: Saldo, Media, Passi e Bici (ciascuna con un mini grafico a barre sottili dei sette giorni su griglia puntinata), Peso, Pasto libero.
- **Pannelli aperti dalla Settimana** (come nella bozza):
  - **Passi** e **Bici**: in alto le frecce per passare alla settimana precedente e successiva restando nel pannello; il numero grande nel colore della misura (media dei passi al giorno; km della settimana); grafico a barre dei sette giorni; elenco dei soli giorni che hanno un valore, con la fonte. Bici mostra il dettaglio "4,4 km da Salute + 8 km a mano" e in fondo il tasto pieno "Aggiungi uscita in bici". Cambiare settimana nel pannello non cambia la settimana della schermata sotto.
  - **Peso**: ultima pesata con la variazione, storico completo in un elenco unico (senza frecce delle settimane), tasto pieno "Aggiungi pesata".
  - **Pasto libero**: frecce delle settimane; stato della settimana; elenco dei pasti della settimana con "Segna"; tasto pieno "Aggiungi pasto libero", che apre il pannello Aggiungi con l'interruttore "Pasto libero" già acceso. Se la settimana ha già un pasto libero: il pasto, "Rimuovi pasto libero", e niente tasto di aggiunta.
- **Pannelli aperti dal tasto +** (come nella bozza): Aggiungi (selettore, campo con il tasto "Preferiti", "Stima", poi Pesata e Uscita in bici; dalla fase 8 nessuna riga "Preferiti" sotto il campo); proposta dell'AI (pasto e interruttore "Pasto libero" in un elenco, piatti in tessere, correzione a parole, "Rifai la stima"); Preferiti (ricerca, pasti e piatti; dalla fase 8 un tocco mette l'etichetta nella frase e scorrendo una riga a sinistra compaiono "Modifica" su fondo Tessera ed "Elimina" su fondo Fuori, come tessere separate); Uscita in bici (la riga "Giorno" apre il calendario di sistema; mai giorni futuri); Pesata. Nella scheda del piatto in Manuale "Stima con l'AI" sta sopra la riga "Calorie". "Copia da ieri" non esiste (tolta nella fase 4b) e non va reintrodotta.
- **Collegamenti**: sezione "Salute" (stato, ultimo invio, valori ricevuti oggi, "Rigenera il codice", "Disattiva") e sezione "Stime dei pasti" con il nome leggibile del modello in uso (per esempio "Gemini 2.5 Flash", ricavato dal modello configurato sul server), lo stato e le stime fatte oggi sul limite.
- **Trend** (dalla fase 9): come Settimana, con il selettore Settimana | Mese | Anno sotto l'intestazione (§2). Grafici non esiste più.

### 10.6 Testi
I nomi di comandi, titoli ed etichette sono in `docs/TESTI.md`, tabella "com'è → come diventa", approvata dall'utente. Regole: un comando dice esattamente cosa fa ("Aggiungi uscita in bici", non "Bici a mano"); niente gergo interno; niente paragrafi di spiegazione; maiuscola solo a inizio frase.

## 11. Idee future

Non decise e non pianificate: nessun task le anticipa. L'elenco aggiornato sta nelle issue di GitHub con l'etichetta `idea`; qui solo ciò che conviene sapere per non chiudersi delle strade.
- Dispensa di ingredienti con i loro valori e piatti composti dall'AI secondo criteri dell'utente, con kcal e nutrienti sommati dall'app. Il campo "quantità" con ingredienti e grammi (§4) è il primo mattone: non va trasformato in qualcosa di incompatibile.
- Viste di Oggi e Trend compatte e personalizzabili.
- Trend con intervalli personalizzati (dal… al…, "ultimi 30 giorni") e deficit stimato confrontato con il peso reale.
- Calorie reali delle uscite in bici lette da Salute.

<!-- Prova collaudo #84 -->
