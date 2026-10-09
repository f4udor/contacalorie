-- Aggiornamento per chi ha già eseguito setup.sql e gli aggiornamenti delle fasi 4, 5 e 5b (migrazioni 1-14).
-- Da eseguire UNA volta sola nell'editor SQL di Supabase (SQL Editor → New query), prima di pubblicare la fase 5c.
-- File generato da supabase/migrations con `npm run setup-sql`: non modificarlo a mano.

-- ===== 20260101000015_profilo_obiettivi.sql =====
-- Fase 5c (T5c.3): obiettivi calcolati dal profilo. Solo aggiunte: sesso e data entro cui raggiungere il peso obiettivo.
-- Età, altezza, peso e peso obiettivo ci sono già. Nessun valore predefinito: vuoto = profilo incompleto o senza data.
alter table public.settings add column sex text check (sex in ('uomo', 'donna'));
alter table public.settings add column target_date date;
