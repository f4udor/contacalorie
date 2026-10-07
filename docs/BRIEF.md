# Personal Health: brief di prodotto

## 1. Scopo

App personale per tracciare dieta ipocalorica e attività fisica. Un solo utente, su iPhone (web app installata sulla Home) e computer, con gli stessi dati. Deve essere semplice, solida e ampliabile per moduli.

## 2. Schermate

Navigazione in basso: **Oggi, Settimana, Grafici, Impostazioni**.

### Oggi
1. Data con frecce per cambiare giorno e tasto "Oggi".
2. Anello delle kcal: rimaste al centro; sotto, la riga di composizione dell'obiettivo ("Base 2.100 · bici +400 · passi +75 · recupero −106").
3. Griglia di schede dei nutrienti: proteine, carboidrati, grassi, fibre, sale. Ogni scheda: nome, "assunto su obiettivo", barretta colorata a semaforo.
4. Pasti del giorno raggruppati per Colazione, Pranzo, Cena, Spuntino. Ogni pasto: nome, kcal, macro, etichetta "libero" se lo è. Modifica ed eliminazione.
5. Attività: passi e bici (km, kcal), con la fonte ("da Salute" o "manuale").
6. Sfida mattutina: esercizi del giorno da spuntare, ripetizioni modificabili, "Salta".
7. Pulsante **+** sempre visibile.

### Pannello Aggiungi (dal +)
- In cima: campo di testo con microfono. L'utente detta o scrive, il modello AI restituisce uno o più pasti stimati, l'utente conferma, corregge i numeri a mano oppure invia una correzione a voce o testo ("il riso era poco") che aggiorna la stima.
- Preferiti, "Copia da ieri", inserimento manuale dei numeri.
- Interruttore "Pasto libero", disattivato se già usato nella settimana.
- Voci separate: "Pesata" e "Attività a mano".

### Settimana (lunedì-domenica)
- Sette barre delle kcal mangiate con la linea dell'obiettivo di ogni giorno.
- Saldo della settimana, media kcal, medie dei nutrienti, km in bici, passi medi, pasto libero usato o no, giorni di sfida completati.

### Grafici
- Peso, kcal e deficit, macro medi, attività. Periodo: 4 settimane, 3 mesi, tutto.

### Impostazioni
- Profilo: peso, altezza, età, peso obiettivo.
- Obiettivi: kcal base, soglia minima, grammi dei nutrienti (proposti, ritoccabili), margine dei semafori.
- Attività: kcal per km, kcal per passo, soglia passi, quota di bonus.
- Pasto libero: tetto di kcal.
- Collegamenti: modello AI, token per i Comandi rapidi.
- Stato delle automazioni: data e ora dell'ultimo invio riuscito da Salute.
- Dati: esportazione in CSV/Excel.

## 3. Regole di calcolo

Tutti i valori sono impostazioni con questi default.

| Impostazione | Default |
|---|---|
| `baseKcal` | 2100 |
| `floorKcal` | 1800 |
| `bonusShare` | 0,5 |
| `kcalPerKm` | 27 |
| `kcalPerStep` | 0,05 |
| `stepThreshold` | 6000 |
| `freeMealCap` | 800 |
| `proteinPerKg` | 1,4 |
| `fatShare` | 0,30 |
| `fiberMin` | 30 g |
| `saltMax` | 5 g |
| `margin` | 0,10 |
| `overLimit` | 1,5 |

### 3.1 Kcal contate nel budget
`kcalBudget(giorno)` = somma delle kcal dei pasti, dove un pasto libero conta `min(kcal, freeMealCap)`. Le kcal mostrate come "mangiate" sono sempre quelle reali.

Pasto libero: al massimo uno per settimana. Gli altri sgarri si inseriscono come pasti normali e contano per intero.

### 3.2 Bonus attività
- `kcalBici` = kcal registrate da Salute se presenti, altrimenti `km × kcalPerKm`.
- `bonusBici` = arrotonda(`bonusShare × kcalBici`).
- `bonusPassi` = arrotonda(`bonusShare × max(0, passi − stepThreshold) × kcalPerStep`).

### 3.3 Obiettivo del giorno
Per il giorno di indice `i` nella settimana (lunedì = 0):

1. `saldo` = somma, sui giorni precedenti della stessa settimana **che hanno almeno un pasto**, di `baseKcal + bonusBici + bonusPassi − kcalBudget`.
2. `recupero` = `min(0, saldo) / (7 − i)`. Un saldo positivo non alza l'obiettivo: il vantaggio resta.
3. `baseDelGiorno` = `max(min(floorKcal, baseKcal), baseKcal + recupero)`.
4. `obiettivo` = arrotonda(`baseDelGiorno + bonusBici + bonusPassi`) del giorno stesso.

La soglia minima vale per la base: il bonus attività si somma sopra. Ogni lunedì il saldo riparte da zero.

### 3.4 Obiettivi dei nutrienti
- Proteine = `proteinPerKg × peso`, arrotondate ai 5 g.
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
| B | Come A; mercoledì mangiate 3.250 kcal, nessun pasto libero. Giovedì senza attività | Saldo −425, recupero −106,25, obiettivo gio = 1.994 |
| C | Come B, ma il pranzo di mercoledì da 2.250 kcal è pasto libero | `kcalBudget` mer = 1.800, saldo positivo, obiettivo gio = 2.100 |
| D | Lunedì 5.000 kcal, nessun pasto libero. Martedì senza attività | Recupero −483,33 limitato dalla soglia: obiettivo mar = 1.800 |
| E | Bici 30 km inserita a mano, nessun saldo negativo | Bonus 405, obiettivo = 2.505, carboidrati = 329 g |
| F | Bici con 800 kcal da Salute, nessun saldo negativo | Bonus 400, obiettivo = 2.500, carboidrati = 328 g |
| G | Giorno base a 2.100 kcal | Carboidrati = 228 g |
| H | Giorno senza pasti tra lunedì e oggi | Non entra nel saldo |
| I | Proteine 125 g su 140 | Giallo (soglia verde 126) |
| J | Sale 4,8 g su 5 | Giallo; 5,1 g rosso; 4,4 g verde |

## 4. Pasti e modello AI

- Al modello arriva solo il testo del pasto (ed eventualmente la stima precedente e la correzione). Nessun altro dato dell'utente.
- Risposta strutturata: elenco di pasti, ognuno con nome, fascia, kcal, proteine, carboidrati, grassi, fibre, sale e una nota breve sulle quantità ipotizzate.
- Nulla viene salvato senza conferma dell'utente.
- Ogni pasto stimato conserva il testo originale.
- Provider intercambiabile dietro `AiProvider`; il primo è Gemini. In sviluppo si usa un provider finto con risposte fisse.
- I preferiti sono pasti salvati con i loro numeri. Niente ricette con ingredienti, niente foto.

## 5. Attività e automazioni

Salute e Promemoria di Apple non sono raggiungibili da un server: i dati arrivano da Comandi rapidi su iPhone che chiamano l'app.

- **Ingresso dati Salute**: riceve passi e uscite in bici (km, kcal) degli ultimi giorni. Ripetere lo stesso invio non crea doppioni. Un valore inserito a mano dall'utente non viene sovrascritto.
- **Ingresso pasto**: riceve un testo dettato a Siri e crea una stima in attesa di conferma.
- **Ingresso promemoria** (modulo opzionale, ultima fase): restituisce i promemoria da creare, già scritti, una sola volta per giorno.
- Tutti gli ingressi sono protetti da un token personale generato in Impostazioni.
- **Guardiano**: se da più di un giorno non arriva nulla da Salute, l'app mostra un banner e invia un'email.
- Ogni ingresso registra data e ora dell'ultima chiamata riuscita.

## 6. Sfida mattutina

Piano di 30 giorni precaricato, con data di inizio modificabile.

- Push up: ripetizioni pari al numero del giorno.
- Altri esercizi: ripetizioni = base + 5 × ((giorno − 1) mod 3). Ogni esercizio entra dal suo giorno di inizio.

| Esercizio | Dal giorno | Base | Per lato |
|---|---|---|---|
| Crunch | 1 | 20 | no |
| Crunch incrociati | 1 | 10 | sì |
| Dead bug | 4 | 10 | sì |
| Tocchi ai talloni | 7 | 10 | sì |
| Ponte glutei | 10 | 10 | no |
| Bird dog | 13 | 10 | sì |
| Squat | 16 | 10 | no |
| Plank laterale con discesa bacino | 19 | 10 | sì |
| Superman | 22 | 10 | no |
| Russian twist (piedi a terra) | 25 | 10 | sì |
| Plank con tocco spalla | 28 | 10 | sì |

Per ogni esercizio del giorno: fatto, ripetizioni modificate, saltato. Nel database la sfida è un "piano" con "esercizi", così in futuro si possono aggiungere altri piani senza cambiare lo schema.

## 7. Dati

Login con email, senza password. Ogni riga appartiene a un utente e nessuno può leggere righe altrui.

Tabelle previste: impostazioni, pasti, preferiti, attività giornaliera, pesate, piani della sfida, esercizi del piano, registro giornaliero della sfida, token degli ingressi, registro delle chiamate agli ingressi.

## 8. Fasi

| Fase | Contenuto |
|---|---|
| 1 | Motore dei calcoli con test, schema del database |
| 2 | Schermate Oggi, Settimana, Impostazioni; peso; sfida |
| 3 | Inserimento a voce e testo con AI, correzione, preferiti |
| 4 | Ingressi per i Comandi rapidi, guardiano |
| 5 | Grafici |
| 6 | Promemoria (opzionale) |

## 9. Fuori dalla prima versione

Nuova sfida creata col modello, esercizi come etichette con serie, editor della sfida, app nativa, foto del piatto, Strava.
