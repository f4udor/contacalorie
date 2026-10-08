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
