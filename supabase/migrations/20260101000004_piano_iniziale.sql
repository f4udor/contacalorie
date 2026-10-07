-- Piano iniziale di 30 giorni (BRIEF §6), piano di sistema (user_id null).

insert into public.challenge_plans (id, user_id, name, duration_days, rep_step, cycle_length)
values ('00000000-0000-4000-8000-000000000001', null, 'Sfida mattutina 30 giorni', 30, 5, 3);

insert into public.challenge_exercises (plan_id, name, from_day, base_reps, per_side, progression, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'Push up', 1, 0, false, 'day', 1),
  ('00000000-0000-4000-8000-000000000001', 'Crunch', 1, 20, false, 'cycle', 2),
  ('00000000-0000-4000-8000-000000000001', 'Crunch incrociati', 1, 10, true, 'cycle', 3),
  ('00000000-0000-4000-8000-000000000001', 'Dead bug', 4, 10, true, 'cycle', 4),
  ('00000000-0000-4000-8000-000000000001', 'Tocchi ai talloni', 7, 10, true, 'cycle', 5),
  ('00000000-0000-4000-8000-000000000001', 'Ponte glutei', 10, 10, false, 'cycle', 6),
  ('00000000-0000-4000-8000-000000000001', 'Bird dog', 13, 10, true, 'cycle', 7),
  ('00000000-0000-4000-8000-000000000001', 'Squat', 16, 10, false, 'cycle', 8),
  ('00000000-0000-4000-8000-000000000001', 'Plank laterale con discesa bacino', 19, 10, true, 'cycle', 9),
  ('00000000-0000-4000-8000-000000000001', 'Superman', 22, 10, false, 'cycle', 10),
  ('00000000-0000-4000-8000-000000000001', 'Russian twist (piedi a terra)', 25, 10, true, 'cycle', 11),
  ('00000000-0000-4000-8000-000000000001', 'Plank con tocco spalla', 28, 10, true, 'cycle', 12);
