-- Fase 5b (T5b.1): la soglia del recupero passa da 25 a 50 kcal, uguale al limite verde dell'anello delle kcal.
-- La colonna non ha un valore predefinito: vuota vale il valore dell'app (ora 50). Le righe che hanno ancora il vecchio 25 passano a 50.
update public.settings set recovery_min = 50 where recovery_min = 25;
