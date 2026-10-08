-- Personal Health: schema completo del database.
-- Incolla tutto questo file nell'editor SQL di Supabase (SQL Editor → New query) ed esegui UNA volta sola.
-- File generato da supabase/migrations con `npm run setup-sql`: non modificarlo a mano.

-- ===== 20260101000001_tabelle_utente.sql =====
-- Tabelle dei dati personali. Ogni riga appartiene a un utente (user_id) e
-- le regole di sicurezza per riga (RLS) permettono di leggere e scrivere solo le proprie.
-- Il database cresce per aggiunte: mai rinominare o eliminare colonne esistenti.

-- Impostazioni: una riga per utente. Colonna null = usa il default dell'app.
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weight_kg numeric check (weight_kg > 0),
  height_cm numeric check (height_cm > 0),
  age_years integer check (age_years > 0),
  target_weight_kg numeric check (target_weight_kg > 0),
  base_kcal numeric check (base_kcal >= 0),
  floor_kcal numeric check (floor_kcal >= 0),
  bonus_share numeric check (bonus_share >= 0),
  kcal_per_km numeric check (kcal_per_km >= 0),
  kcal_per_step numeric check (kcal_per_step >= 0),
  step_threshold numeric check (step_threshold >= 0),
  free_meal_cap numeric check (free_meal_cap >= 0),
  protein_per_kg numeric check (protein_per_kg >= 0),
  fat_share numeric check (fat_share >= 0),
  fiber_min numeric check (fiber_min >= 0),
  salt_max numeric check (salt_max >= 0),
  margin numeric check (margin >= 0),
  over_limit numeric check (over_limit >= 0),
  protein_grams_manual numeric check (protein_grams_manual >= 0),
  fat_grams_manual numeric check (fat_grams_manual >= 0),
  ai_provider text,
  updated_at timestamptz not null default now()
);

-- Pasti del giorno.
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('colazione', 'pranzo', 'cena', 'spuntino')),
  name text not null,
  kcal numeric not null check (kcal >= 0),
  protein numeric not null default 0 check (protein >= 0),
  carbs numeric not null default 0 check (carbs >= 0),
  fat numeric not null default 0 check (fat >= 0),
  fiber numeric not null default 0 check (fiber >= 0),
  salt numeric not null default 0 check (salt >= 0),
  is_free boolean not null default false,
  original_text text,
  created_at timestamptz not null default now()
);
create index meals_user_date_idx on public.meals (user_id, date);

-- Preferiti: pasti salvati con i loro numeri.
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  slot text check (slot in ('colazione', 'pranzo', 'cena', 'spuntino')),
  kcal numeric not null check (kcal >= 0),
  protein numeric not null default 0 check (protein >= 0),
  carbs numeric not null default 0 check (carbs >= 0),
  fat numeric not null default 0 check (fat >= 0),
  fiber numeric not null default 0 check (fiber >= 0),
  salt numeric not null default 0 check (salt >= 0),
  created_at timestamptz not null default now()
);
create index favorites_user_idx on public.favorites (user_id);

-- Attività giornaliera: una riga per utente e data, con fonte distinta per passi e bici.
create table public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  steps integer check (steps >= 0),
  steps_source text check (steps_source in ('salute', 'manuale')),
  bike_km numeric check (bike_km >= 0),
  bike_kcal_health numeric check (bike_kcal_health >= 0),
  bike_source text check (bike_source in ('salute', 'manuale')),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Pesate.
create table public.weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Sicurezza per riga: ognuno legge e scrive solo le proprie righe.
alter table public.settings enable row level security;
alter table public.meals enable row level security;
alter table public.favorites enable row level security;
alter table public.daily_activity enable row level security;
alter table public.weigh_ins enable row level security;

create policy settings_own on public.settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy meals_own on public.meals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy favorites_own on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy daily_activity_own on public.daily_activity for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy weigh_ins_own on public.weigh_ins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 20260101000002_sfida.sql =====
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

-- ===== 20260101000003_ingressi.sql =====
-- Ingressi per i Comandi rapidi: token personali e registro delle chiamate.
-- Del token si salva solo l'impronta (hash), mai il valore in chiaro.

create table public.ingest_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('salute', 'pasto', 'promemoria')),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index ingest_tokens_user_idx on public.ingest_tokens (user_id);

create table public.ingest_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('salute', 'pasto', 'promemoria')),
  called_at timestamptz not null default now(),
  success boolean not null,
  detail text
);
create index ingest_log_user_idx on public.ingest_log (user_id, called_at desc);

alter table public.ingest_tokens enable row level security;
alter table public.ingest_log enable row level security;

create policy ingest_tokens_own on public.ingest_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ingest_log_own on public.ingest_log for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 20260101000004_piano_iniziale.sql =====
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

-- ===== 20260101000005_piatti_e_proteine.sql =====
-- Fase 3, solo per aggiunta.
-- T3.0: un pasto è l'insieme dei piatti di una fascia in un giorno. Nessuna colonna cambia:
--   ogni riga di `meals` è un piatto e il segno `is_free` sta su tutti i piatti del pasto.
-- T3.2: quantità facoltativa del piatto, in testo libero (es. "100 g").
alter table public.meals add column quantity text;

-- T3.1: grammi di proteine per kg di peso obiettivo (default dell'app: 1,8; null = default).
alter table public.settings add column protein_per_kg_target numeric check (protein_per_kg_target >= 0);

-- ===== 20260101000006_stime_ai.sql =====
-- Fase 4: conteggio delle stime AI al giorno per utente. Solo aggiunte.
create table public.ai_usage (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
create policy "ai_usage: leggi le tue" on public.ai_usage for select using (user_id = auth.uid());
create policy "ai_usage: inserisci le tue" on public.ai_usage for insert with check (user_id = auth.uid());
create policy "ai_usage: modifica le tue" on public.ai_usage for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Conta una stima di oggi (giorno di Roma) se non è già stato raggiunto il limite.
-- Restituisce il conteggio dopo l'incremento, oppure -1 se il limite era già raggiunto.
create function public.use_ai_estimate(p_limit integer) returns integer
language plpgsql security invoker set search_path = public as $$
declare
  today date := (now() at time zone 'Europe/Rome')::date;
  new_count integer;
begin
  insert into public.ai_usage as u (user_id, day, count) values (auth.uid(), today, 1)
  on conflict (user_id, day) do update set count = u.count + 1 where u.count < p_limit
  returning u.count into new_count;
  return coalesce(new_count, -1);
end;
$$;

-- ===== 20260101000007_preferiti.sql =====
-- Fase 4, solo per aggiunta. Preferiti.
-- I piatti preferiti usano la tabella `favorites` esistente, con la quantità in più.
alter table public.favorites add column quantity text;

-- Pasti preferiti: un pasto salvato con tutti i suoi piatti (nome, quantità e numeri), in una sola riga.
create table public.favorite_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  slot text check (slot in ('colazione', 'pranzo', 'cena', 'spuntino')),
  dishes jsonb not null check (jsonb_typeof(dishes) = 'array'),
  created_at timestamptz not null default now()
);
create index favorite_meals_user_idx on public.favorite_meals (user_id);

alter table public.favorite_meals enable row level security;
create policy favorite_meals_own on public.favorite_meals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 20260101000008_primo_avvio.sql =====
-- Fase 4, solo per aggiunta. Il primo avvio guidato è stato fatto o saltato (non si ripropone).
alter table public.settings add column onboarding_done boolean;

-- ===== 20260101000009_contatore_ai_protetto.sql =====
-- Fase 4, correzione di sicurezza. Il contatore delle stime AI non deve essere modificabile
-- dall'utente: altrimenti potrebbe azzerarlo e superare il limite giornaliero.
-- Si tolgono i permessi di inserimento e modifica diretti; il conteggio passa solo dalla funzione,
-- che gira con i permessi del proprietario e usa sempre l'utente della sessione.
drop policy if exists "ai_usage: inserisci le tue" on public.ai_usage;
drop policy if exists "ai_usage: modifica le tue" on public.ai_usage;

create or replace function public.use_ai_estimate(p_limit integer) returns integer
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Europe/Rome')::date;
  new_count integer;
begin
  if uid is null then
    return -1;
  end if;
  insert into public.ai_usage as u (user_id, day, count) values (uid, today, 1)
  on conflict (user_id, day) do update set count = u.count + 1 where u.count < p_limit
  returning u.count into new_count;
  return coalesce(new_count, -1);
end;
$$;

revoke all on function public.use_ai_estimate(integer) from public, anon;
grant execute on function public.use_ai_estimate(integer) to authenticated;

-- ===== 20260101000010_ingresso_salute.sql =====
-- Fase 5: ingresso dei dati da Salute. Solo aggiunte (più la chiusura dei permessi diretti sulle tabelle degli ingressi).
-- Il Comando rapido non ha una sessione: chiama la funzione con il codice personale, di cui il database conosce solo l'impronta.

-- Il registro delle chiamate e i codici non devono essere scritti dall'utente: si leggono soltanto.
drop policy if exists ingest_log_own on public.ingest_log;
drop policy if exists ingest_tokens_own on public.ingest_tokens;
create policy ingest_log_read on public.ingest_log for select to authenticated using (user_id = auth.uid());
create policy ingest_tokens_read on public.ingest_tokens for select to authenticated using (user_id = auth.uid());

-- p_rows: [{ "date": "2026-10-08", "steps": 8123, "km": 12.4 }, ...] (campi facoltativi, già filtrati su oggi e ieri).
-- Risposta: { status: 'unauthorized' | 'limit' | 'failed' | 'ok', saved: [...], kept: [...] }.
-- Un valore con fonte 'manuale' non viene mai sovrascritto; per la bici si salvano solo i km.
create function public.ingest_health(
  p_code text, p_rows jsonb, p_limit integer, p_discarded integer default 0, p_failure text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
  today date := (now() at time zone 'Europe/Rome')::date;
  r jsonb;
  d date;
  s integer;
  k numeric;
  ex public.daily_activity%rowtype;
  saved jsonb := '[]'::jsonb;
  kept jsonb := '[]'::jsonb;
  one jsonb;
  had boolean;
begin
  if p_code is null or p_code = '' then
    return jsonb_build_object('status', 'unauthorized');
  end if;
  select t.user_id into uid from public.ingest_tokens t
    where t.kind = 'salute' and t.revoked_at is null
      and t.token_hash = encode(sha256(convert_to(p_code, 'utf8')), 'hex');
  if uid is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  if (select count(*) from public.ingest_log l
        where l.user_id = uid and l.kind = 'salute' and (l.called_at at time zone 'Europe/Rome')::date = today) >= p_limit then
    return jsonb_build_object('status', 'limit');
  end if;

  if p_failure is not null then
    insert into public.ingest_log (user_id, kind, success, detail) values (uid, 'salute', false, left(p_failure, 300));
    return jsonb_build_object('status', 'failed');
  end if;

  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    d := (r ->> 'date')::date;
    s := (r ->> 'steps')::integer;
    k := (r ->> 'km')::numeric;
    -- Solo oggi e ieri (anche qui, oltre che nel server).
    continue when d is null or d < today - 1 or d > today;
    select * into ex from public.daily_activity a where a.user_id = uid and a.date = d;
    had := found;
    one := jsonb_build_object('date', d);

    if s is not null and s > 0 then
      if had and ex.steps is not null and ex.steps_source = 'manuale' then
        kept := kept || jsonb_build_object('date', d, 'campo', 'passi');
      else
        insert into public.daily_activity as a (user_id, date, steps, steps_source) values (uid, d, s, 'salute')
          on conflict (user_id, date) do update set steps = excluded.steps, steps_source = 'salute', updated_at = now();
        one := one || jsonb_build_object('steps', s);
      end if;
    end if;

    if k is not null and k > 0 then
      if had and (ex.bike_km is not null or ex.bike_kcal_health is not null) and ex.bike_source = 'manuale' then
        kept := kept || jsonb_build_object('date', d, 'campo', 'bici_km');
      else
        insert into public.daily_activity as a (user_id, date, bike_km, bike_kcal_health, bike_source) values (uid, d, k, null, 'salute')
          on conflict (user_id, date) do update set bike_km = excluded.bike_km, bike_kcal_health = null, bike_source = 'salute', updated_at = now();
        one := one || jsonb_build_object('km', k);
      end if;
    end if;

    if one ? 'steps' or one ? 'km' then
      saved := saved || one;
    end if;
  end loop;

  if jsonb_array_length(saved) = 0 and jsonb_array_length(kept) = 0 then
    insert into public.ingest_log (user_id, kind, success, detail) values (uid, 'salute', false, 'Nessuna riga utile');
    return jsonb_build_object('status', 'failed');
  end if;
  insert into public.ingest_log (user_id, kind, success, detail)
    values (uid, 'salute', true, format('Righe salvate: %s, lasciate: %s, scartate: %s', jsonb_array_length(saved), jsonb_array_length(kept), coalesce(p_discarded, 0)));
  return jsonb_build_object('status', 'ok', 'saved', saved, 'kept', kept);
end;
$$;

revoke all on function public.ingest_health(text, jsonb, integer, integer, text) from public, anon, authenticated;
grant execute on function public.ingest_health(text, jsonb, integer, integer, text) to anon, authenticated;
