-- Fase 3, solo per aggiunta.
-- T3.0: un pasto è l'insieme dei piatti di una fascia in un giorno. Nessuna colonna cambia:
--   ogni riga di `meals` è un piatto e il segno `is_free` sta su tutti i piatti del pasto.
-- T3.2: quantità facoltativa del piatto, in testo libero (es. "100 g").
alter table public.meals add column quantity text;

-- T3.1: grammi di proteine per kg di peso obiettivo (default dell'app: 1,8; null = default).
alter table public.settings add column protein_per_kg_target numeric check (protein_per_kg_target >= 0);
