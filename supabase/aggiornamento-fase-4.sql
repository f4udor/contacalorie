-- Aggiornamento per chi ha già eseguito setup.sql fino alla fase 3 (migrazioni 1-5).
-- Da eseguire una sola volta nell'editor SQL di Supabase.

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
