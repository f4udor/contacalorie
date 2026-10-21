# Report fase 4b: ritocchi delle schermate

## 1. In parole semplici

**Cosa c'è ora.** Schermate più essenziali, meno testo, l'AI come via principale.
- **Pannello Aggiungi (+).** Accanto al titolo c'è un selettore **AI | Manuale** e si apre sempre su **AI**. AI: il campo «Cosa hai mangiato?» è vuoto, senza esempi, e c'è **Stima**; se l'AI non è collegata l'avviso dice di usare «Manuale». Manuale: i campi del piatto, con **Stima con AI** quando i numeri sono vuoti. Sotto restano solo **Preferiti**, **Attività a mano** e **Pesata**, senza righe grigie di spiegazione. Spariscono «Piatto a mano» e «Copia da ieri».
- **«+ Aggiungi piatto» sotto un pasto.** Apre lo stesso pannello, su AI, con il nome della fascia come titolo (per esempio «Pranzo»). La fascia è fissata: tutti i piatti che l'AI propone vanno lì, anche se l'AI ne indicava un'altra. Sotto compare solo «Preferiti».
- **Proposta dell'AI a righe.** Ogni piatto è una riga: nome, quantità («ipotizzata» se lo è), kcal. Toccando la riga si aprono i numeri da correggere e «Togli». Un piatto con un numero sbagliato si apre da solo e la riga dice «da correggere». Sparisce la frase «Controlla la stima…».
- **Preferiti.** Ogni riga ha un **+** a destra: un tocco e si aggiunge. «Elimina» non è più nella lista: **Modifica** (accanto al campo «Cerca») mostra «Elimina» su ogni riga e nasconde i +; **Fine** torna indietro. Se arrivi dal pasto, la scelta della fascia non c'è.
- **Oggi.** Sotto l'anello la riga «Base … · bici … · passi … · recupero …» compare solo se c'è qualcosa oltre alla base. «kcal sopra di» è diventato «kcal oltre». Senza attività la scheda dice solo «Nessuna attività».
- **Settimana: scheda Peso.** Mostra l'ultima pesata della settimana e di quanti kg è cambiata rispetto alla pesata precedente (o, se non ce n'è, al peso di partenza del profilo). La differenza è **verde** se ti avvicini al peso obiettivo, **rossa** se ti allontani (anche se l'obiettivo è salire), **grigia** senza obiettivo o senza variazione. Senza pesate nella settimana la scheda non c'è.
- **Niente testi d'esempio** nei campi (anche nel primo avvio e nell'accesso).

**Cosa manca.** Dati da Salute e Fitness (fase 5), grafici (fase 6), promemoria (fase 7). L'AI e Supabase restano da provare dal vero (vedi parte tecnica).

### Cosa provare sul telefono dopo la pubblicazione (5 minuti)
1. **+**: in alto «AI | Manuale» con **AI** attivo, campo vuoto, nessuna frase sul microfono. Senza AI collegata compare l'avviso «Usa Manuale».
2. **Manuale**: nome, quantità, **fascia**, kcal; con le kcal vuote e l'AI attiva compare **Stima con AI**. Salva un piatto.
3. Sotto il campo ci sono solo **Preferiti**, **Attività a mano**, **Pesata**; «Piatto a mano» e «Copia da ieri» non ci sono più.
4. In un pasto tocca **+ Aggiungi piatto**: il titolo è il nome della fascia, sotto c'è solo **Preferiti**. Con l'AI collegata scrivi una frase che nomina un'altra fascia («a cena…»): i piatti proposti finiscono comunque nella fascia del pasto, e non c'è la scelta della fascia.
5. Con l'AI: dopo **Stima** ogni piatto è una riga; tocca una riga e cambia le kcal; svuota le kcal e premi **Conferma**: la riga si apre da sola con l'errore e dice «da correggere».
6. **Preferiti**: un **+** su ogni riga e un tocco aggiunge; **Modifica** → compaiono gli **Elimina** (serve una conferma) e spariscono i +; **Fine** torna indietro.
7. **Oggi** in un giorno normale: sotto l'anello non c'è più la riga «Base …»; con una uscita in bici o passi oltre la soglia la riga c'è. Con le kcal oltre l'obiettivo si legge «kcal oltre». Con attività vuota: «Nessuna attività».
8. **Settimana**: con almeno una pesata nella settimana c'è la scheda **Peso** con il numero e la differenza colorata («dalla pesata precedente» o «dal peso di partenza»); in una settimana senza pesate non c'è.
9. **Peso di partenza**: salva una pesata da **+ → Pesata** e controlla in *Impostazioni → Profilo* che il tuo peso non sia cambiato.

## 2. Tecnica

### Task

| Task | Esito |
|---|---|
| T4b.1 Pannello Aggiungi: AI \| Manuale | fatto |
| T4b.2 Proposta della stima a righe compatte | fatto |
| T4b.3 Preferiti: + e Modifica | fatto |
| T4b.4 Oggi: testi ripuliti | fatto |
| T4b.5 Peso nella Settimana | fatto |
| T4b.6 Report di fase | questo file |

Nessun task `bloccato` e nessun respingimento: tutti approvati dal subagente `revisore` al primo giro. I commit intermedi «in corso» (screenshot in rigenerazione) di T4b.1 e T4b.4 sono richiesti dal controllo di fine sessione.

### Come sono fatte le cose
- **Pannello Aggiungi** (`add-panel.tsx`): selettore `ModeSwitch`; la parte principale resta montata (nascosta) quando si apre Preferiti, Attività o Pesata, così testo scritto e proposta non si perdono. `Sheet` accetta un elemento accanto al titolo. `forceSlot` (`proposal-form.ts`) porta tutti i piatti proposti in un solo pasto nella fascia fissata. Tolti `copy-meals.ts` e il suo test.
- **Proposta a righe:** `ai-estimate.tsx` (righe che si aprono, apertura automatica dei piatti con errore).
- **Preferiti:** `favorites-view.tsx` (+, modalità Modifica, nessuna scelta della fascia se fissata).
- **Oggi:** `hasCompositionDetail` in `today-view.ts`, testi in `kcal-ring.tsx` e `activity-card.tsx`.
- **Settimana:** `weekWeight` in `src/app/lib/week-weight.ts` (funzione pura) e scheda Peso in `settimana-screen.tsx`.
- **Motore, database:** nessuna modifica (nessuna nuova tabella o colonna, nessun test del motore toccato).

### Test
- **432 test in 38 file** (Vitest), tutti verdi; `lint` e `build` passano. In questa fase: 417 → 432 (tolti 2 test di «Copia da ieri»; aggiunti `forceSlot`, `hasCompositionDetail`, 13 test di `weekWeight`).
- `weekWeight` copre: nessuna pesata nella settimana; confronto con la pesata precedente; confronto con il peso di partenza; obiettivo sotto e sopra; nessun obiettivo; variazione zero (anche dopo l'arrotondamento); pesate non ordinate; bordi lunedì e domenica; superamento dell'obiettivo.
- Screenshot: **122 scenari × chiaro e scuro a 390 px (244 immagini)** in `docs/screenshots/`; lo script non segnala scorrimento orizzontale né aree sotto 44 px (il selettore AI | Manuale è stato allargato a 44 px). Nello script i campi si compilano solo se visibili (il modulo manuale resta nascosto ma presente quando si è su AI).
- La percentuale di copertura non è misurata.

### Decisioni da confermare
Elenco completo in `docs/DIARIO.md`. Le principali: la parte principale del pannello resta montata per non perdere il testo scritto; con la fascia fissata tutti i piatti proposti finiscono in un solo pasto in quella fascia; le righe della proposta partono tutte chiuse; in Modifica sparisce anche la scelta della fascia; per il peso la distanza dall'obiettivo si confronta sui valori esatti e la variazione «zero» è la differenza arrotondata a 0,0; la scheda Peso compare anche in una settimana con la sola pesata; tolti i testi d'esempio anche da primo avvio e accesso. Restano due etichette con la parola «facoltativa» («Quantità (facoltativa)», «Kcal bici (facoltative)»): sono etichette, non esempi nei campi, ma se vanno tolte anche quelle basta dirlo.

### Limiti e cose non verificate
- Come nelle fasi precedenti, **Vertex AI e Supabase non sono provati dal vero**: la proposta, la fascia fissata e le correzioni sono provate solo con risposte finte e con il provider finto.
- Nessuna prova con il tocco su iPhone: il selettore AI | Manuale, le righe che si aprono, il + e Modifica nei Preferiti.
- La raccomandazione del brief (una pesata a settimana, stesso giorno, al mattino) non è scritta nell'app.
- Gli screenshot a 375 e 430 px non sono stati rigenerati (l'ultima verifica a quelle larghezze è la fase 2).
- Il bottone «Elimina davvero» (testo bianco su rosso) ha un contrasto un po' basso in tema chiaro: esisteva già prima di questa fase.
