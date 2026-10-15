-- Fase 7 (T7.0): peso del piatto in grammi. Solo aggiunte: una colonna facoltativa (intero, vuoto ammesso) in `meals` e in `favorites`.
-- Il peso dei piatti di `favorite_meals` sta dentro il campo JSON `dishes` (campo `weightG`, facoltativo): nessuna colonna da aggiungere.
alter table public.meals add column weight_g integer check (weight_g is null or weight_g > 0);
alter table public.favorites add column weight_g integer check (weight_g is null or weight_g > 0);
