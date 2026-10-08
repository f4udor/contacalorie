# Schema del database

Migrazioni in `supabase/migrations`. Ogni tabella ha `user_id` (tranne i piani di sistema) e sicurezza per riga: un utente legge e scrive solo le proprie righe. Il database cresce per aggiunte: mai rinominare o eliminare colonne.

| Tabella | Descrizione |
|---|---|
| `settings` | Una riga per utente: profilo, obiettivi, regole di calcolo comprese le proteine per kg di peso (e di peso obiettivo), null = default dell'app; le colonne del piano e della data di inizio della sfida non sono più usate. |
| `meals` | Piatti: una riga per piatto (data, fascia, nome, quantità, kcal, macro, fibre, sale, testo originale dettato). I piatti di una data e fascia formano un pasto; il segno `is_free` sta su tutti i piatti del pasto. |
| `favorites` | Piatti preferiti con i loro numeri e la quantità, da riusare. |
| `favorite_meals` | Pasti preferiti: nome, fascia e tutti i piatti (con numeri e quantità) in un campo JSON. |
| `daily_activity` | Una riga per utente e data: passi, km e kcal bici, con fonte (`salute` o `manuale`) distinta per passi e bici. |
| `weigh_ins` | Pesate, una per utente e data. |
| `challenge_plans` | (Non più usata dall'app dalla fase 4.) Piani della sfida; `user_id` null = piano di sistema, leggibile da tutti e non modificabile. |
| `challenge_exercises` | (Non più usata dall'app dalla fase 4.) Esercizi di un piano: giorno di inizio, ripetizioni base, per lato, tipo di progressione. |
| `challenge_log` | (Non più usata dall'app dalla fase 4.) Registro giornaliero della sfida: per esercizio e data, fatto o saltato ed eventuali ripetizioni modificate. |
| `ingest_tokens` | Token personali degli ingressi per i Comandi rapidi (solo l'impronta, mai il valore in chiaro). |
| `ingest_log` | Registro delle chiamate agli ingressi, con esito e ora. |
| `ai_usage` | Stime AI contate per utente e giorno (funzione `use_ai_estimate`), per il limite giornaliero. |

Il piano di 30 giorni (`00000000-0000-4000-8000-000000000001`) è inserito come dato iniziale da `20260101000004_piano_iniziale.sql`.

`supabase/setup.sql` è l'unione di tutte le migrazioni, in ordine, da incollare nell'editor SQL di Supabase (si rigenera con `npm run setup-sql`).
