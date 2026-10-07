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
