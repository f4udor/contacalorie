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
