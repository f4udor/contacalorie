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
