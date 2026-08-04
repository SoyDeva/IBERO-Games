create or replace function public.submit_galactic_score(
  p_token text,
  p_season text,
  p_season_name text,
  p_distance integer,
  p_checkpoints integer,
  p_correct integer,
  p_destroyed integer,
  p_skin text default 'nebula',
  p_trail text default 'pulse'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_pilot_id uuid;
  v_position bigint;
  v_rows integer := 0;
  v_min_distance bigint;
  v_max_distance bigint;
  v_max_destroyed integer;
begin
  if p_token is null or char_length(p_token) <> 64 then
    raise exception using errcode = 'P0001', message = 'invalid_session';
  end if;
  if p_season !~ '^v[0-9A-Za-z._-]{1,31}$'
     or char_length(p_season_name) not between 3 and 80 then
    raise exception using errcode = 'P0001', message = 'invalid_season';
  end if;
  if p_distance not between 0 and 2000000
     or p_checkpoints not between 0 and 560
     or p_correct <> p_checkpoints
     or p_destroyed < 0
     or p_skin not in ('nebula', 'solar', 'aqua', 'aurora', 'guardian', 'eclipse')
     or p_trail not in ('pulse', 'comet', 'ion', 'nature', 'rainbow', 'vector', 'navigator', 'quasar') then
    raise exception using errcode = 'P0001', message = 'invalid_score';
  end if;

  v_min_distance := case
    when p_checkpoints = 0 then 0
    else 6::bigint * p_checkpoints * p_checkpoints + 324::bigint * p_checkpoints - 50
  end;
  v_max_distance := 6::bigint * (p_checkpoints + 1) * (p_checkpoints + 1)
                    + 324::bigint * (p_checkpoints + 1) - 25;

  -- El juego puede iniciar con hasta cinco cargas y entregar plasma mediante
  -- desafíos, Núcleos Nébula, Modo Nébula, hitos y la Estación Nova. Este
  -- límite sigue bloqueando resultados absurdos sin rechazar esas mecánicas.
  v_max_destroyed := 12 + 8 * p_checkpoints;

  if p_distance::bigint < v_min_distance
     or p_distance::bigint > v_max_distance
     or p_destroyed > v_max_destroyed then
    raise exception using errcode = 'P0001', message = 'invalid_score';
  end if;

  select pilot_id into v_pilot_id
    from private.galactic_sessions
   where token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex')
     and last_used_at >= now() - interval '1 year'
   for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'invalid_session';
  end if;

  perform private.enforce_galactic_rate_limit('score', v_pilot_id::text, 60, interval '1 hour');

  update private.galactic_sessions
     set last_used_at = now()
   where token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');

  insert into public.galactic_seasons(code, name)
  values (p_season, p_season_name)
  on conflict (code) do nothing;

  insert into public.galactic_scores(
    season_code, pilot_id, distance, checkpoints, correct_answers,
    destroyed, skin, trail, achieved_at
  )
  values (
    p_season, v_pilot_id, p_distance, p_checkpoints, p_correct,
    p_destroyed, p_skin, p_trail, now()
  )
  on conflict (season_code, pilot_id) do update
    set distance = excluded.distance,
        checkpoints = excluded.checkpoints,
        correct_answers = excluded.correct_answers,
        destroyed = excluded.destroyed,
        skin = excluded.skin,
        trail = excluded.trail,
        achieved_at = excluded.achieved_at
  where excluded.distance > public.galactic_scores.distance
     or (excluded.distance = public.galactic_scores.distance
         and excluded.correct_answers > public.galactic_scores.correct_answers)
     or (excluded.distance = public.galactic_scores.distance
         and excluded.correct_answers = public.galactic_scores.correct_answers
         and excluded.destroyed > public.galactic_scores.destroyed);

  get diagnostics v_rows = row_count;

  select ranked.rank_position into v_position
  from (
    select
      pilot_id,
      row_number() over (
        order by distance desc, correct_answers desc, destroyed desc, achieved_at asc
      ) as rank_position
    from public.galactic_scores
    where season_code = p_season
  ) ranked
  where ranked.pilot_id = v_pilot_id;

  return jsonb_build_object('position', v_position, 'updated', v_rows > 0);
end;
$$;

revoke all on function public.submit_galactic_score(text, text, text, integer, integer, integer, integer, text, text) from public;
grant execute on function public.submit_galactic_score(text, text, text, integer, integer, integer, integer, text, text) to anon, authenticated;
