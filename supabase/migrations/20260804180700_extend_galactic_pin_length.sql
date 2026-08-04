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

  if v_pin is not null and char_length(v_pin) not between 4 and 12 then
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

revoke all on function public.claim_galactic_pilot(text, text) from public;
grant execute on function public.claim_galactic_pilot(text, text) to anon, authenticated;
