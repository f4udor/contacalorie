# Diario

Una riga per task chiuso.

## Task chiusi

- T1.0 · fatto · bloccato dopo due revisioni per il buco `./../` nella regola di lint; chiuso dopo la fase con la correzione indicata dal revisore (regex `^(?!\./[A-Za-z0-9_-]+$)`) e tre casi di test in più, verificati: falliscono con la regola vecchia, passano con la nuova.
- T1.1 · fatto · tipi, default di §3, `mergeSettings` con test. Aggiunti `proteinGramsManual`/`fatGramsManual` (null = formula).
- T1.2 · fatto · kcal di budget (`kcalBudget`, tetto pasto libero), kcal reali (`kcalEaten`), `hasFreeMealInWeek` con esclusione.
- T1.3 · fatto · bonus bici (`bikeBonus`) e passi (`stepsBonus`); casi A, E, F.
- T1.4 · fatto · `dayTarget` (§3.3) con date in UTC (`dates.ts`); casi A, B, C, D, H. Il giorno stesso è escluso dal saldo; date duplicate in ingresso non gestite.
- T1.5 · fatto · `nutrientTargets` (§3.4); casi E, F, G. Carboidrati arrotondati al grammo intero.
- T1.6 · fatto · semafori minimo/intervallo/tetto e anello kcal (`traffic.ts`); casi I, J e tutti i confini.
- T1.7 · fatto · `weekSummary`: giorni, saldo, medie, km, passi, pasto libero, sfida; settimana vuota → `null`. Scelte in 'Decisioni da confermare'.
- T1.8 · fatto · `challengeDay` con piano come dato (`DEFAULT_CHALLENGE_PLAN` in file a parte); aggiunta `daysBetween`.
- T1.9 · fatto · 10 migrazioni/tabelle con RLS, piano di 30 giorni come dato iniziale, `docs/SCHEMA.md`. Provate solo su PostgreSQL locale con stand-in di Supabase (vedi Non verificato).
- T1.10 · fatto · `docs/REPORT-FASE-1.md` scritto.
- T2.0 · fatto · `src/data`: interfaccia `DataStore` async, implementazioni in memoria e nel browser (stessa classe a snapshot con versione del formato 1), avviso su dati illeggibili; regola di lint che vieta `localStorage` fuori da `src/data`.
- T2.1 · fatto · guscio: barra in basso, variabili CSS chiaro/scuro, manifest e icone, pannello dal basso (`Sheet`), avviso dati, `npm run screens` con scenari in `tests/fixtures/`. Cose non provabili in 'Non verificato'.
- T2.2 · fatto · Oggi: data con frecce, anello kcal, composizione, cinque schede nutrienti (`today-view.ts` + test); scenari vuoto, normale, caso B, bici, sforato, giorno passato. Formati italiani in `format.ts`.
- T2.3 · fatto · Oggi: lista pasti per fascia, pulsante +, pannello Aggiungi (pasto a mano, Copia da ieri, segnaposto voce), modifica/eliminazione con conferma, interruttore pasto libero. Stato vuoto senza zeri. Tolta la pagina di prova del pannello.
- T2.4 · fatto · Oggi: scheda Attività (fonte manuale / da Salute), pannelli Attività a mano e Pesata con controlli sui campi; obiettivo e proteine si aggiornano subito. Accento scuro più saturo per il contrasto.
- T2.5 · fatto · Oggi: sezione Sfida mattutina (Giorno N/30 · fatti X su Y, spunta, ripetizioni modificabili, Salta, 'per lato', 'nuovo', messaggi prima/dopo, nota sul dolore); `challenge-view.ts` con test. Scelte in 'Decisioni da confermare'.
- T2.6 · fatto · Settimana: sette barre con linea dell'obiettivo (colore dell'anello), frecce di settimana, riepilogo da `weekSummary`, tocco su barra → giorno in Oggi; `buildWeekView` con test.
- T2.7 · fatto · Impostazioni: profilo, obiettivi (formula proposta per proteine e grassi, 'Torna alla formula'), attività, pasto libero, sfida; validazione con errori accanto ai campi (`settings-form.ts` + test); ripristino con conferma. Le modifiche arrivano in Oggi.
- T2.8 · fatto · rifinitura: 312 screenshot (52 scenari, chiaro/scuro, 375/390/430 px), nessuna segnalazione di scorrimento o aree piccole; scheda nutrienti dispari a tutta larghezza, placeholder più leggibili, intestazione Settimana.
- T2.9 · fatto · `docs/REPORT-FASE-2.md` scritto, con i 10 controlli da fare sul telefono.

## Decisioni da confermare

- Carboidrati arrotondati al grammo intero (§3.4 non lo specifica; gli esempi di §3.6 sono interi).
- Soglia gialla dell'anello kcal (×1,05) è una costante `KCAL_RING_YELLOW_LIMIT` in `defaults.ts`, non un'impostazione modificabile: §3 non la elenca tra le impostazioni.
- Semaforo "tetto" (sale): assunto esattamente uguale al tetto → giallo; rosso solo se supera il tetto.
- Il giorno di cui si calcola l'obiettivo non entra nel proprio saldo (solo i giorni precedenti).
- Riepilogo settimana: "media kcal" usa le kcal reali (non il budget); "saldo" usa il budget (pasto libero col tetto); passi 0 sono considerati assenti nella media; km totali `null` solo se nessun giorno ha km registrati.
- Il saldo della settimana somma tutti i giorni con pasti (anche l'ultimo), a differenza del saldo di `dayTarget` che si ferma ai giorni precedenti.
- Piano della sfida come piano di sistema (`user_id` null, uguale per tutti) scelto da `settings.challenge_plan_id`; la data di inizio è in `settings.challenge_start_date`.
- Il vincolo "un solo pasto libero a settimana" non è nel database (si controlla nell'app con `hasFreeMealInWeek`).
- Token degli ingressi: nel database solo l'impronta (hash).
- Pagine Oggi, Settimana e Impostazioni sono segnaposto fino ai task che le riempiono; Grafici resta "In arrivo".
- Oggi: l'anello e le "kcal rimaste" usano il budget (pasto libero col tetto); le "mangiate" mostrate sono quelle reali.
- Oggi: in un giorno senza pasti le barrette dei nutrienti sono neutre (non gialle), le schede mostrano "–" invece di 0 e sotto l'anello compare solo l'obiettivo. Senza peso, anche la scheda dei carboidrati mostra "Obiettivo dopo il peso", perché il loro obiettivo dipende da quello delle proteine.
- Oggi: il peso per le proteine è l'ultima pesata fino al giorno mostrato; se non c'è, il peso del profilo; se non c'è, la prima pesata successiva.
- Il giorno mostrato in Oggi sta nell'indirizzo (`/?d=AAAA-MM-GG`).
- Pasti: fascia predefinita "Pranzo"; nome vuoto salvato come "Pasto"; "Copia da ieri" copia tutti i pasti di ieri come normali e, se li ripeti, li duplica; per eliminare un pasto la conferma è dentro il pannello (non una finestra del browser).
- Pasto libero: l'interruttore è attivo in modifica del pasto che è già l'unico libero della settimana; disattivato in tutti gli altri casi se la settimana ne ha già uno.
- Attività a mano: le kcal della bici scritte dall'utente sono salvate nello stesso campo di quelle di Salute (`bikeKcalHealth`, per il motore sono "kcal registrate"), con fonte "manuale"; passi e kcal sono numeri interi, i km possono avere decimali. Campi lasciati vuoti restano assenti (non zero).
- Pesata: una per giorno; la seconda sostituisce la prima. Il peso salvato è subito usato per le proteine.
- Tema scuro: colore d'accento `#0a84ff` (con il precedente più chiaro il testo bianco sui pulsanti aveva poco contrasto).
- In Oggi l'ordine è anello, nutrienti, pasti, attività (poi la sfida, T2.5).
- Sfida: nel registro l'esercizio è identificato dal suo nome nel piano; togliere la spunta di un esercizio cancella la sua voce (anche le ripetizioni modificate). Senza data di inizio la sezione invita a impostarla (la data si potrà cambiare in T2.7); la nota sul dolore compare con la lista degli esercizi e nel pannello dell'esercizio.
- Ripetizioni modificate: si cambiano toccando l'esercizio ("Fatto" le salva e segna l'esercizio come fatto); "Salta" lo segna saltato; "Rimetti da fare" cancella la voce.
- Settimana: il colore di ogni barra usa il budget contro l'obiettivo (come l'anello), l'altezza le kcal reali; la linea dell'obiettivo è un tratto per ogni giorno; i giorni futuri mostrano solo il tratto. Il saldo include anche il giorno in corso, con i pasti ancora da mangiare che risultano "vantaggio" (è il calcolo del motore, T1.7).
- Giorno di sfida "completato" = ogni esercizio del giorno è "fatto"; un esercizio saltato non conta. Nella schermata Settimana "0 giorni" è mostrato come "–".
- La settimana mostrata sta nell'indirizzo (`/settimana?w=AAAA-MM-GG`, un giorno qualsiasi di quella settimana).
- Impostazioni: un solo modulo con un pulsante "Salva" (non un salvataggio per campo); un campo vuoto = valore predefinito (mostrato come suggerimento); se un campo non è valido non si salva nulla. Margine e quota di bonus si scrivono in percentuale (10 % = 0,10). Limiti dei campi (es. margine al massimo 50 %) scelti di buon senso, per respingere errori di battitura.
- "Ripristina valori predefiniti" toglie obiettivi, regole di calcolo, attività e tetto del pasto libero; profilo (peso, altezza, età, peso obiettivo) e data della sfida restano.
- La formula proposta per proteine e grassi usa le impostazioni salvate (non quelle in corso di modifica) e il peso più recente.
- Rifinitura (T2.8): l'ultima scheda dei nutrienti occupa tutta la riga quando il numero è dispari (niente scheda "orfana" a metà); suggerimenti dei campi vuoti più leggibili in tema scuro; intestazione di Settimana con l'intervallo sotto il titolo (a 375 px il tasto "Questa settimana" andava a capo). Nessuna funzione nuova.

## Non verificato

- T1.0: la regola di lint `no-restricted-imports` non copre `require()` né `import()` dinamico.
- T1.9: le migrazioni sono state eseguite solo su un PostgreSQL 16 locale con uno stand-in di `auth.users`/`auth.uid()` e del ruolo `authenticated`; non su Supabase reale. Verificato lì: creazione di tutte le tabelle, dato iniziale (1 piano, 12 esercizi), isolamento tra due utenti (lettura, modifica, inserimento altrui rifiutati), piano di sistema non modificabile, unicità attività per utente e data. Non verificato: comportamento con il vero `auth.uid()` di Supabase, grant dei ruoli Supabase, `gen_random_uuid()` su Supabase.
- T2.1: installazione sulla Home dell'iPhone, schermo intero e aree sicure reali (notch, barra home) non si possono provare nell'ambiente: il codice usa `viewport-fit=cover` e `env(safe-area-inset-*)`, ma gli screenshot li hanno a zero.
- T2.1: pannello dal basso provato in un browser headless con il mouse (Esc, Chiudi, tocco fuori, trascinamento corto e lungo: tutto come atteso), non con il tocco di un iPhone. Nessun test automatico oltre a `shouldCloseOnDrag`.
- T2.1: `npm run screens` a 390 px, chiaro e scuro: 10 screenshot, nessuna segnalazione (niente scorrimento orizzontale, aree toccabili ≥ 44 px, pagine entro 844 px).
- T2.3: aggiunta, modifica, eliminazione e "Copia da ieri" provate in un browser headless (dati salvati e ancora presenti dopo il ricaricamento della pagina); non provate con il tocco su iPhone né con la tastiera numerica di iOS (`inputmode="decimal"`: su iPhone in italiano dovrebbe offrire la virgola, non verificato).
- T2.7: il campo data della sfida è il selettore nativo del telefono: su iPhone in italiano dovrebbe mostrare gg/mm/aaaa; negli screenshot (browser senza lingua italiana) appare mm/gg/aaaa. Non verificato su iPhone.
- T2.8: controllati a mano 375, 390 e 430 px (52 scenari × chiaro e scuro = 312 immagini) per scorrimento orizzontale e aree toccabili con lo script (nessuna segnalazione); l'aspetto è stato guardato su un campione rappresentativo di schermate, non su tutte le 312 immagini una per una.
