create index if not exists galactic_scores_pilot_id_idx
  on public.galactic_scores (pilot_id);

alter table private.galactic_pilots enable row level security;
alter table private.galactic_sessions enable row level security;
alter table private.galactic_rate_limits enable row level security;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

create or replace function public.claim_galactic_pilot(
  p_nickname text,
  p_pin text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_nickname text := private.clean_galactic_nickname(p_nickname);
  v_pin text := nullif(p_pin, '');
  v_pilot private.galactic_pilots%rowtype;
  v_token text;
  v_created boolean := false;
  v_subject text := encode(extensions.digest(convert_to(lower(v_nickname), 'UTF8'), 'sha256'), 'hex');
begin
  if char_length(v_nickname) not between 2 and 18
     or v_nickname ~ '[[:cntrl:]<>]' then
    raise exception using errcode = 'P0001', message = 'invalid_nickname';
  end if;

  if v_pin is not null and char_length(v_pin) not between 4 and 8 then
    raise exception using errcode = 'P0001', message = 'invalid_pin_length';
  end if;

  select * into v_pilot
    from private.galactic_pilots
   where lower(nickname) = lower(v_nickname)
   for update;

  if not found then
    if v_pin is null then
      raise exception using errcode = 'P0001', message = 'pin_required';
    end if;

    perform private.enforce_galactic_rate_limit(
      'register', private.request_fingerprint(), 80, interval '1 hour'
    );

    begin
      insert into private.galactic_pilots(nickname, pin_hash)
      values (v_nickname, extensions.crypt(v_pin, extensions.gen_salt('bf', 10)))
      returning * into v_pilot;
      v_created := true;
    exception when unique_violation then
      raise exception using errcode = 'P0001', message = 'nickname_taken';
    end;
  elsif v_pilot.pin_hash is null then
    perform private.enforce_galactic_rate_limit(
      'protect', v_subject, 8, interval '10 minutes'
    );

    if v_pin is null then
      raise exception using errcode = 'P0001', message = 'pin_required';
    end if;

    update private.galactic_pilots
       set pin_hash = extensions.crypt(v_pin, extensions.gen_salt('bf', 10)),
           last_seen_at = now()
     where id = v_pilot.id
     returning * into v_pilot;
  else
    perform private.enforce_galactic_rate_limit(
      'unlock', v_subject, 8, interval '10 minutes'
    );

    if v_pin is null then
      raise exception using errcode = 'P0001', message = 'pin_required';
    end if;
    if extensions.crypt(v_pin, v_pilot.pin_hash) <> v_pilot.pin_hash then
      raise exception using errcode = 'P0001', message = 'pin_invalid';
    end if;
  end if;

  v_token := private.new_galactic_session(v_pilot.id);
  update private.galactic_pilots set last_seen_at = now() where id = v_pilot.id;

  return jsonb_build_object(
    'nickname', v_pilot.nickname,
    'token', v_token,
    'protected', true,
    'created', v_created
  );
end;
$$;

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
     or p_trail not in ('pulse', 'comet', 'ion', 'nature', 'rainbow') then
    raise exception using errcode = 'P0001', message = 'invalid_score';
  end if;

  v_min_distance := case
    when p_checkpoints = 0 then 0
    else 6::bigint * p_checkpoints * p_checkpoints + 324::bigint * p_checkpoints - 50
  end;
  v_max_distance := 6::bigint * (p_checkpoints + 1) * (p_checkpoints + 1)
                    + 324::bigint * (p_checkpoints + 1) - 25;
  v_max_destroyed := 3 + 3 * (p_checkpoints / 5) + 2 * (p_checkpoints / 10);

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

revoke all on function public.claim_galactic_pilot(text, text) from public;
revoke all on function public.submit_galactic_score(text, text, text, integer, integer, integer, integer, text, text) from public;
grant execute on function public.claim_galactic_pilot(text, text) to anon, authenticated;
grant execute on function public.submit_galactic_score(text, text, text, integer, integer, integer, integer, text, text) to anon, authenticated;
