# Schema del database

Migrazioni in `supabase/migrations`. Ogni tabella ha `user_id` (tranne i piani di sistema) e sicurezza per riga: un utente legge e scrive solo le proprie righe. Il database cresce per aggiunte: mai rinominare o eliminare colonne.

| Tabella | Descrizione |
|---|---|
| `settings` | Una riga per utente: profilo, obiettivi, regole di calcolo (null = default dell'app), piano e data di inizio della sfida. |
| `meals` | Pasti del giorno: fascia, kcal, macro, fibre, sale, pasto libero e testo originale dettato. |
| `favorites` | Pasti salvati con i loro numeri, da riusare. |
| `daily_activity` | Una riga per utente e data: passi, km e kcal bici, con fonte (`salute` o `manuale`) distinta per passi e bici. |
| `weigh_ins` | Pesate, una per utente e data. |
| `challenge_plans` | Piani della sfida; `user_id` null = piano di sistema, leggibile da tutti e non modificabile. |
| `challenge_exercises` | Esercizi di un piano: giorno di inizio, ripetizioni base, per lato, tipo di progressione. |
| `challenge_log` | Registro giornaliero della sfida: per esercizio e data, fatto o saltato ed eventuali ripetizioni modificate. |
| `ingest_tokens` | Token personali degli ingressi per i Comandi rapidi (solo l'impronta, mai il valore in chiaro). |
| `ingest_log` | Registro delle chiamate agli ingressi, con esito e ora. |

Il piano di 30 giorni (`00000000-0000-4000-8000-000000000001`) è inserito come dato iniziale da `20260101000004_piano_iniziale.sql`.
