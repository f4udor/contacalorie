-- Sfida mattutina: un "piano" con "esercizi", così si possono aggiungere altri piani
-- senza cambiare lo schema. I piani con user_id null sono di sistema: leggibili da tutti,
-- non modificabili dagli utenti.

create table public.challenge_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  duration_days integer not null check (duration_days > 0),
  rep_step integer not null default 5 check (rep_step >= 0),
  cycle_length integer not null default 3 check (cycle_length > 0),
  created_at timestamptz not null default now()
);

create table public.challenge_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.challenge_plans (id) on delete cascade,
  name text not null,
  from_day integer not null check (from_day >= 1),
  base_reps integer not null check (base_reps >= 0),
  per_side boolean not null default false,
  progression text not null check (progression in ('day', 'cycle')),
  sort_order integer not null default 0
);
create index challenge_exercises_plan_idx on public.challenge_exercises (plan_id);

-- Registro giornaliero: per ogni esercizio del giorno fatto, ripetizioni modificate o saltato.
create table public.challenge_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  exercise_id uuid not null references public.challenge_exercises (id) on delete cascade,
  status text not null check (status in ('fatto', 'saltato')),
  reps integer check (reps >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, date, exercise_id)
);
create index challenge_log_user_date_idx on public.challenge_log (user_id, date);

-- Piano scelto e data di inizio (modificabile), per utente. Colonne aggiunte a settings.
alter table public.settings add column challenge_plan_id uuid references public.challenge_plans (id);
alter table public.settings add column challenge_start_date date;

alter table public.challenge_plans enable row level security;
alter table public.challenge_exercises enable row level security;
alter table public.challenge_log enable row level security;

create policy challenge_plans_read on public.challenge_plans for select to authenticated
  using (user_id is null or user_id = auth.uid());
create policy challenge_plans_write on public.challenge_plans for insert to authenticated
  with check (user_id = auth.uid());
create policy challenge_plans_update on public.challenge_plans for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy challenge_plans_delete on public.challenge_plans for delete to authenticated
  using (user_id = auth.uid());

create policy challenge_exercises_read on public.challenge_exercises for select to authenticated
  using (exists (select 1 from public.challenge_plans p
                 where p.id = plan_id and (p.user_id is null or p.user_id = auth.uid())));
create policy challenge_exercises_write on public.challenge_exercises for all to authenticated
  using (exists (select 1 from public.challenge_plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.challenge_plans p where p.id = plan_id and p.user_id = auth.uid()));

create policy challenge_log_own on public.challenge_log for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
