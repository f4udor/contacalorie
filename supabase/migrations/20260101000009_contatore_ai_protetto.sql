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
