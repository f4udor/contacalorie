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
