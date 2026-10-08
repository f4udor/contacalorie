-- Fase 5: creazione e revoca del codice personale per i dati da Salute. Solo aggiunte.
-- Il codice nasce nel database e torna all'app una sola volta; nel database resta solo l'impronta.

create function public.create_health_token() returns text
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  code text;
begin
  if uid is null then
    raise exception 'Accesso necessario';
  end if;
  update public.ingest_tokens set revoked_at = now() where user_id = uid and kind = 'salute' and revoked_at is null;
  code := 'ph' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.ingest_tokens (user_id, kind, token_hash) values (uid, 'salute', encode(sha256(convert_to(code, 'utf8')), 'hex'));
  return code;
end;
$$;

create function public.revoke_health_token() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Accesso necessario';
  end if;
  update public.ingest_tokens set revoked_at = now() where user_id = auth.uid() and kind = 'salute' and revoked_at is null;
end;
$$;

revoke all on function public.create_health_token() from public, anon;
revoke all on function public.revoke_health_token() from public, anon;
grant execute on function public.create_health_token() to authenticated;
grant execute on function public.revoke_health_token() to authenticated;
