-- Fase 5: nuova regola del recupero (BRIEF §3.3). Solo aggiunte; null = valore predefinito dell'app.
alter table public.settings add column recovery_max_per_day numeric check (recovery_max_per_day >= 0);
alter table public.settings add column credit_cap numeric check (credit_cap >= 0);
alter table public.settings add column recovery_min numeric check (recovery_min >= 0);
