-- Aggiornamento per chi ha già eseguito setup.sql e gli aggiornamenti delle fasi 4, 5, 5b e 5c (migrazioni 1-15).
-- Da eseguire UNA volta sola nell'editor SQL di Supabase (SQL Editor → New query), prima di pubblicare la fase 7.
-- File generato da supabase/migrations con `npm run setup-sql`: non modificarlo a mano.

-- ===== 20260101000016_peso_piatto.sql =====
-- Fase 7 (T7.0): peso del piatto in grammi. Solo aggiunte: una colonna facoltativa (intero, vuoto ammesso) in `meals` e in `favorites`.
-- Il peso dei piatti di `favorite_meals` sta dentro il campo JSON `dishes` (campo `weightG`, facoltativo): nessuna colonna da aggiungere.
alter table public.meals add column weight_g integer check (weight_g is null or weight_g > 0);
alter table public.favorites add column weight_g integer check (weight_g is null or weight_g > 0);
