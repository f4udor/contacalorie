-- Aggiornamento per chi ha già eseguito setup.sql e aggiornamento-fase-4.sql (migrazioni 1-9).
-- Da eseguire UNA volta sola nell'editor SQL di Supabase (SQL Editor → New query).
-- File generato da supabase/migrations con `npm run setup-sql`: non modificarlo a mano.

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

-- ===== 20260101000011_codice_salute.sql =====
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

-- ===== 20260101000012_recupero.sql =====
-- Fase 5: nuova regola del recupero (BRIEF §3.3). Solo aggiunte; null = valore predefinito dell'app.
alter table public.settings add column recovery_max_per_day numeric check (recovery_max_per_day >= 0);
alter table public.settings add column credit_cap numeric check (credit_cap >= 0);
alter table public.settings add column recovery_min numeric check (recovery_min >= 0);

-- ===== 20260101000013_bici_a_mano.sql =====
-- Fase 5b (T5b.0): passi in sola lettura e bici a mano che si somma ai km di Salute. Solo aggiunte.
-- bike_km, bike_kcal_health e bike_source restano la parte di Salute; le due colonne nuove sono la parte inserita a mano
-- (un valore per giorno). Gli invii da Salute scrivono sempre e solo la parte di Salute.

alter table public.daily_activity add column bike_km_manual numeric check (bike_km_manual >= 0);
alter table public.daily_activity add column bike_kcal_manual numeric check (bike_kcal_manual >= 0);

-- I valori di bici che oggi hanno fonte 'manuale' passano nella parte a mano del loro giorno, senza perdere nulla.
update public.daily_activity
  set bike_km_manual = bike_km,
      bike_kcal_manual = bike_kcal_health,
      bike_km = null,
      bike_kcal_health = null,
      bike_source = null,
      updated_at = now()
  where bike_source = 'manuale';

-- Ingresso da Salute: i passi sostituiscono anche un vecchio valore con fonte 'manuale'; la bici scrive solo la parte di Salute.
-- p_rows: [{ "date": "2026-10-08", "steps": 8123, "km": 12.4 }, ...] (campi facoltativi, già filtrati su oggi e ieri).
-- Risposta: { status: 'unauthorized' | 'limit' | 'failed' | 'ok', saved: [...], kept: [] } (kept resta per compatibilità: ora è sempre vuoto).
create or replace function public.ingest_health(
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
  saved jsonb := '[]'::jsonb;
  one jsonb;
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
    one := jsonb_build_object('date', d);

    if s is not null and s > 0 then
      insert into public.daily_activity as a (user_id, date, steps, steps_source) values (uid, d, s, 'salute')
        on conflict (user_id, date) do update set steps = excluded.steps, steps_source = 'salute', updated_at = now();
      one := one || jsonb_build_object('steps', s);
    end if;

    if k is not null and k > 0 then
      -- Solo la parte di Salute: bike_km_manual e bike_kcal_manual non si toccano mai.
      insert into public.daily_activity as a (user_id, date, bike_km, bike_kcal_health, bike_source) values (uid, d, k, null, 'salute')
        on conflict (user_id, date) do update set bike_km = excluded.bike_km, bike_kcal_health = null, bike_source = 'salute', updated_at = now();
      one := one || jsonb_build_object('km', k);
    end if;

    if one ? 'steps' or one ? 'km' then
      saved := saved || one;
    end if;
  end loop;

  if jsonb_array_length(saved) = 0 then
    insert into public.ingest_log (user_id, kind, success, detail) values (uid, 'salute', false, 'Nessuna riga utile');
    return jsonb_build_object('status', 'failed');
  end if;
  insert into public.ingest_log (user_id, kind, success, detail)
    values (uid, 'salute', true, format('Righe salvate: %s, lasciate: 0, scartate: %s', jsonb_array_length(saved), coalesce(p_discarded, 0)));
  return jsonb_build_object('status', 'ok', 'saved', saved, 'kept', '[]'::jsonb);
end;
$$;

revoke all on function public.ingest_health(text, jsonb, integer, integer, text) from public, anon, authenticated;
grant execute on function public.ingest_health(text, jsonb, integer, integer, text) to anon, authenticated;
