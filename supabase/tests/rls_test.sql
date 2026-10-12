-- =====================================================================
-- Row Level Security tests.
--
-- Impersonates anonymous visitors, a regular member and a moderator, tries
-- each operation the app performs, and checks the database allows or blocks
-- it. Everything runs inside one transaction that is always rolled back by
-- the final RAISE, so it is safe to run against any database:
--
--   psql "$DATABASE_URL" -f supabase/tests/rls_test.sql
--
-- Success ends with:  ERROR:  ALL RLS TESTS PASSED (rolled back)
-- A failure ends with: ERROR:  RLS TEST FAILED: <which check>
-- =====================================================================

do $$
declare
  member_id uuid;
  other_id  uuid;
  mod_id    uuid;
  share_id  bigint;
  other_share bigint;
  topic_id  bigint;
  n int;
begin
  -- Fixtures: three throwaway users (profiles are created by the auth trigger).
  insert into auth.users (id, email, aud, role) values
    (gen_random_uuid(), 'rls-member@test.invalid', 'authenticated', 'authenticated'),
    (gen_random_uuid(), 'rls-other@test.invalid',  'authenticated', 'authenticated'),
    (gen_random_uuid(), 'rls-mod@test.invalid',    'authenticated', 'authenticated');
  select id into member_id from auth.users where email = 'rls-member@test.invalid';
  select id into other_id  from auth.users where email = 'rls-other@test.invalid';
  select id into mod_id    from auth.users where email = 'rls-mod@test.invalid';
  update public.profiles set role = 'MOD' where id = mod_id;

  insert into public.sharespeare (title, content_rich, status, author_id) values ('other draft', 'x', 'DRAFT', other_id)
    returning id into other_share;
  insert into public.topics (title, body_rich, author_id) values ('t', 'x', other_id) returning id into topic_id;

  -- ---------------- anonymous ----------------
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;

  select count(*) into n from public.sharespeare where id = other_share;
  if n <> 0 then raise exception 'RLS TEST FAILED: anon can read a draft'; end if;

  begin
    insert into public.sharespeare (title, content_rich) values ('anon', 'x');
    raise exception 'RLS TEST FAILED: anon can post';
  exception when insufficient_privilege then null;
  end;

  reset role;

  -- ---------------- member ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', member_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.sharespeare (title, content_rich) values ('mine', 'hello') returning id into share_id;
  select count(*) into n from public.sharespeare where id = share_id and status = 'PUBLISHED' and published_at is not null and author_id = member_id;
  if n <> 1 then raise exception 'RLS TEST FAILED: member post is not published immediately as themselves'; end if;

  begin
    insert into public.sharespeare (title, content_rich, author_id) values ('spoof', 'x', other_id);
    raise exception 'RLS TEST FAILED: member can post as someone else';
  exception when insufficient_privilege then null;
  end;

  update public.sharespeare set title = 'hijack' where id = other_share;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS TEST FAILED: member can edit another user''s post'; end if;

  delete from public.sharespeare where id = other_share;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS TEST FAILED: member can delete another user''s post'; end if;

  begin
    update public.sharespeare set is_hidden = true where id = share_id;
    raise exception 'RLS TEST FAILED: member can set is_hidden directly';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.profiles set role = 'ADMIN' where id = member_id;
    raise exception 'RLS TEST FAILED: member can promote themselves';
  exception when insufficient_privilege then null;
  end;

  update public.profiles set display_name = 'renamed' where id = member_id;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'RLS TEST FAILED: member cannot rename themselves'; end if;

  begin
    perform public.set_content_hidden('sharespeare', other_share, true);
    raise exception 'RLS TEST FAILED: member can hide content';
  exception when insufficient_privilege then null;
  end;

  insert into public.comments (topic_id, body_rich) values (topic_id, 'nice');
  insert into public.reports (target_type, target_id, reason) values ('sharespeare', other_share, 'spam');
  begin
    insert into public.reports (target_type, target_id, reason) values ('sharespeare', other_share, 'again');
    raise exception 'RLS TEST FAILED: duplicate report accepted';
  exception when unique_violation then null;
  end;

  select count(*) into n from public.reports;
  if n <> 1 then raise exception 'RLS TEST FAILED: member sees other people''s reports'; end if;

  reset role;

  -- ---------------- moderator ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', mod_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  perform public.set_content_hidden('sharespeare', share_id, true, 'test');
  perform public.set_topic_locked(topic_id, true);

  reset role;

  -- Hidden post is gone for everyone but its author and moderators.
  perform set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.sharespeare where id = share_id;
  if n <> 0 then raise exception 'RLS TEST FAILED: hidden post still visible to others'; end if;

  -- Locked topic refuses new comments.
  begin
    insert into public.comments (topic_id, body_rich) values (topic_id, 'late');
    raise exception 'RLS TEST FAILED: comment accepted on a locked topic';
  exception when insufficient_privilege then null;
  end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', member_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.sharespeare where id = share_id;
  if n <> 1 then raise exception 'RLS TEST FAILED: author cannot see their own hidden post'; end if;
  reset role;

  raise exception 'ALL RLS TESTS PASSED (rolled back)';
end $$;
