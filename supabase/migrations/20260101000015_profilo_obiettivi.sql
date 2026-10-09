-- Fase 5c (T5c.3): obiettivi calcolati dal profilo. Solo aggiunte: sesso e data entro cui raggiungere il peso obiettivo.
-- Età, altezza, peso e peso obiettivo ci sono già. Nessun valore predefinito: vuoto = profilo incompleto o senza data.
alter table public.settings add column sex text check (sex in ('uomo', 'donna'));
alter table public.settings add column target_date date;
