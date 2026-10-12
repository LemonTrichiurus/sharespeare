-- =====================================================================
-- Open community: switch from pre-moderation (every post reviewed) to
-- post-moderation (publish immediately; moderators hide; users report).
--
-- Applied to production 2026-10-12 (version 20261012042634).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Content columns: hide instead of review
-- ---------------------------------------------------------------------
alter table public.news        add column if not exists is_hidden boolean not null default false,
                               add column if not exists hidden_by uuid references public.profiles(id) on delete set null,
                               add column if not exists hidden_at timestamptz,
                               add column if not exists hidden_reason text;
alter table public.sharespeare add column if not exists is_hidden boolean not null default false,
                               add column if not exists hidden_by uuid references public.profiles(id) on delete set null,
                               add column if not exists hidden_at timestamptz,
                               add column if not exists hidden_reason text;
alter table public.topics      add column if not exists is_hidden boolean not null default false,
                               add column if not exists hidden_by uuid references public.profiles(id) on delete set null,
                               add column if not exists hidden_at timestamptz,
                               add column if not exists hidden_reason text;
alter table public.comments    add column if not exists is_hidden boolean not null default false,
                               add column if not exists hidden_by uuid references public.profiles(id) on delete set null,
                               add column if not exists hidden_at timestamptz,
                               add column if not exists hidden_reason text;

-- Posts go live immediately; drafts stay private to the author (news: to editors).
alter table public.news        alter column status set default 'PUBLISHED';
alter table public.sharespeare alter column status set default 'PUBLISHED';
alter table public.comments    alter column status set default 'APPROVED';

-- Existing review-queue rows: pending → published, rejected → back to the author's drafts.
update public.news        set status = 'PUBLISHED', published_at = coalesce(published_at, now()) where status = 'PENDING';
update public.sharespeare set status = 'PUBLISHED', published_at = coalesce(published_at, now()) where status = 'PENDING';
update public.news        set status = 'DRAFT' where status = 'REJECTED';
update public.sharespeare set status = 'DRAFT' where status = 'REJECTED';
update public.comments    set status = 'APPROVED' where status = 'PENDING';
update public.comments    set status = 'APPROVED', is_hidden = true where status = 'REJECTED';

-- author_id was NOT NULL with ON DELETE SET NULL, so deleting a user failed.
-- Keep their content and show it as "deleted user".
alter table public.news        alter column author_id drop not null;
alter table public.sharespeare alter column author_id drop not null;
alter table public.topics      alter column author_id drop not null;
alter table public.comments    alter column author_id drop not null;

-- ---------------------------------------------------------------------
-- 2. Reports
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  target_type text not null check (target_type in ('news', 'sharespeare', 'topic', 'comment')),
  target_id bigint not null,
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  unique (target_type, target_id, reporter_id)
);
create index if not exists idx_reports_open on public.reports (created_at desc) where resolved_at is null;

-- ---------------------------------------------------------------------
-- 3. Functions: pin search_path, publish-on-insert, moderator RPCs
-- ---------------------------------------------------------------------
create or replace function public.is_mod(u uuid default auth.uid())
returns boolean language sql stable set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id = u and p.role in ('ADMIN', 'MOD'));
$$;

create or replace function public.is_admin(u uuid default auth.uid())
returns boolean language sql stable set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id = u and p.role = 'ADMIN');
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.set_author_id()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.author_id is null then new.author_id := auth.uid(); end if;
  return new;
end $$;

-- Now also runs on INSERT, since posts can be created already PUBLISHED.
create or replace function public.set_published_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'PUBLISHED'::public.publish_status then
    if tg_op = 'INSERT' or old.status is distinct from 'PUBLISHED'::public.publish_status then
      new.published_at := coalesce(new.published_at, now());
    end if;
  else
    new.published_at := null;
  end if;
  return new;
end $$;

create or replace function public.validate_sharespeare_tags()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.tags is not null and exists (
    select 1 from unnest(new.tags) as x(tag_id)
    left join public.tags t on t.id = x.tag_id
    where t.id is null
  ) then
    raise exception 'Invalid tag_id in sharespeare.tags. All values must exist in public.tags(id).';
  end if;
  return new;
end $$;

drop trigger if exists news_published_at  on public.news;
drop trigger if exists share_published_at on public.sharespeare;
create trigger news_published_at  before insert or update on public.news        for each row execute function public.set_published_at();
create trigger share_published_at before insert or update on public.sharespeare for each row execute function public.set_published_at();

-- Hide / unhide any piece of content. Moderators only.
-- Regular users cannot touch is_hidden directly (see column grants below).
create or replace function public.set_content_hidden(
  p_target_type text, p_target_id bigint, p_hidden boolean, p_reason text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  tbl text := case p_target_type
    when 'news' then 'news' when 'sharespeare' then 'sharespeare'
    when 'topic' then 'topics' when 'comment' then 'comments' end;
begin
  if not public.is_mod() then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if tbl is null then
    raise exception 'unknown target type %', p_target_type;
  end if;
  execute format(
    'update public.%I set is_hidden = $1, hidden_by = case when $1 then auth.uid() end,
       hidden_at = case when $1 then now() end, hidden_reason = case when $1 then $2 end
     where id = $3', tbl)
  using p_hidden, p_reason, p_target_id;
  update public.reports set resolved_at = now(), resolved_by = auth.uid()
   where target_type = p_target_type and target_id = p_target_id and resolved_at is null;
end $$;

-- Lock / unlock a topic (stops new comments). Moderators only.
create or replace function public.set_topic_locked(p_topic_id bigint, p_locked boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_mod() then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.topics
     set status = case when p_locked then 'LOCKED'::public.topic_status else 'OPEN'::public.topic_status end
   where id = p_topic_id;
end $$;

-- The auth trigger function must not be callable over the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_content_hidden(text, bigint, boolean, text) from public, anon;
revoke execute on function public.set_topic_locked(bigint, boolean) from public, anon;
grant  execute on function public.set_content_hidden(text, bigint, boolean, text) to authenticated;
grant  execute on function public.set_topic_locked(bigint, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 4. View: respect the caller's RLS (was leaking drafts to anonymous users)
-- ---------------------------------------------------------------------
-- Recreated (not replaced) because the new sharespeare columns change its column list.
drop view if exists public.v_sharespeare_with_tags;
create view public.v_sharespeare_with_tags with (security_invoker = true) as
 select s.*,
        array_agg(t.name)    filter (where t.id is not null) as tag_names_zh,
        array_agg(t.name_en) filter (where t.id is not null) as tag_names_en
   from public.sharespeare s
   left join lateral unnest(s.tags) tag_id(tag_id) on true
   left join public.tags t on t.id = tag_id.tag_id
  group by s.id;
grant select on public.v_sharespeare_with_tags to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Grants: let signed-in users write; RLS decides which rows.
--    Moderation columns are excluded so only set_content_hidden() can change them.
-- ---------------------------------------------------------------------
grant insert, delete on public.news, public.sharespeare, public.topics, public.comments to authenticated;
grant update (title, content_rich, cover_url, category, status)            on public.news        to authenticated;
grant update (title, content_rich, media_url, media_urls, tags, status)    on public.sharespeare to authenticated;
grant update (title, body_rich)                                            on public.topics      to authenticated;
grant update (body_rich)                                                   on public.comments    to authenticated;
grant update (display_name, avatar_url)                                    on public.profiles    to authenticated;
grant insert, update, delete on public.calendar_events, public.homepage_config to authenticated;
grant select, insert on public.reports to authenticated;
grant update (resolved_at, resolved_by) on public.reports to authenticated;
grant all on public.reports to service_role;

-- ---------------------------------------------------------------------
-- 6. Policies: drop everything from the review era, recreate one clean set
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public'
             and tablename in ('profiles','news','sharespeare','topics','comments',
                               'calendar_events','homepage_config','tags','reports')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.reports enable row level security;

-- profiles: public read, edit own (column grants keep `role` and `email` read-only)
create policy profiles_select on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- news: editorial — only editors (MOD) and admins write; everyone reads published
create policy news_select on public.news for select using (
  (status = 'PUBLISHED' and not is_hidden) or (select public.is_mod()));
create policy news_insert_editor on public.news for insert to authenticated with check (
  (select public.is_mod()) and author_id = (select auth.uid()) and status in ('DRAFT', 'PUBLISHED'));
create policy news_update_editor on public.news for update to authenticated
  using ((select public.is_mod()))
  with check ((select public.is_mod()) and status in ('DRAFT', 'PUBLISHED'));
create policy news_delete_editor on public.news for delete to authenticated using ((select public.is_mod()));

-- sharespeare: community posts
--   read:   published and not hidden; authors always see their own; mods see everything
--   write:  signed-in users create/edit/delete their own; mods can delete anything

create policy share_select on public.sharespeare for select using (
  (status = 'PUBLISHED' and not is_hidden) or author_id = (select auth.uid()) or (select public.is_mod()));
create policy share_insert_own on public.sharespeare for insert to authenticated with check (
  author_id = (select auth.uid()) and status in ('DRAFT', 'PUBLISHED'));
create policy share_update_own on public.sharespeare for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and status in ('DRAFT', 'PUBLISHED'));
create policy share_delete_own_or_mod on public.sharespeare for delete to authenticated using (
  author_id = (select auth.uid()) or (select public.is_mod()));

-- topics: anyone signed in can start one; locking goes through set_topic_locked()
create policy topics_select on public.topics for select using (
  not is_hidden or author_id = (select auth.uid()) or (select public.is_mod()));
create policy topics_insert_own on public.topics for insert to authenticated with check (
  author_id = (select auth.uid()) and status = 'OPEN');
create policy topics_update_own on public.topics for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy topics_delete_own_or_mod on public.topics for delete to authenticated using (
  author_id = (select auth.uid()) or (select public.is_mod()));

-- comments: visible immediately; only on open, visible topics
create policy comments_select on public.comments for select using (
  not is_hidden or author_id = (select auth.uid()) or (select public.is_mod()));
create policy comments_insert_own on public.comments for insert to authenticated with check (
  author_id = (select auth.uid())
  and status = 'APPROVED'
  and exists (select 1 from public.topics t where t.id = topic_id and t.status = 'OPEN' and not t.is_hidden));
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy comments_delete_own_or_mod on public.comments for delete to authenticated using (
  author_id = (select auth.uid()) or (select public.is_mod()));

-- calendar: public events readable by all; mods manage
create policy calendar_select on public.calendar_events for select using (
  visibility = 'PUBLIC' or created_by = (select auth.uid()) or (select public.is_mod()));
create policy calendar_insert_mod on public.calendar_events for insert to authenticated with check ((select public.is_mod()));
create policy calendar_update_mod on public.calendar_events for update to authenticated
  using ((select public.is_mod())) with check ((select public.is_mod()));
create policy calendar_delete_mod on public.calendar_events for delete to authenticated using ((select public.is_mod()));

-- homepage_config (featured picks etc.): public read, mods write
create policy homepage_config_select on public.homepage_config for select using (true);
create policy homepage_config_insert_mod on public.homepage_config for insert to authenticated with check ((select public.is_mod()));
create policy homepage_config_update_mod on public.homepage_config for update to authenticated
  using ((select public.is_mod())) with check ((select public.is_mod()));
create policy homepage_config_delete_mod on public.homepage_config for delete to authenticated using ((select public.is_mod()));

-- tags: public read; managed via service role
create policy tags_select on public.tags for select using (true);

-- reports: users file and see their own; mods see and resolve all
create policy reports_insert_own on public.reports for insert to authenticated with check (
  reporter_id = (select auth.uid()));
create policy reports_select_own_or_mod on public.reports for select to authenticated using (
  reporter_id = (select auth.uid()) or (select public.is_mod()));
create policy reports_resolve_mod on public.reports for update to authenticated
  using ((select public.is_mod())) with check ((select public.is_mod()));

-- audit_logs: intentionally no policies — written and read only with the service role.

-- ---------------------------------------------------------------------
-- 7. Storage: collapse 7 overlapping policies into 4
--    Ownership comes from storage.objects.owner, set automatically on upload.
-- ---------------------------------------------------------------------
drop policy if exists media_public_read          on storage.objects;
drop policy if exists media_select_all           on storage.objects;
drop policy if exists "媒体文件公开可见"           on storage.objects;
drop policy if exists media_authenticated_upload on storage.objects;
drop policy if exists "登录用户可上传媒体"         on storage.objects;
drop policy if exists "用户可更新自己的媒体文件"    on storage.objects;
drop policy if exists media_owner_or_mod_delete  on storage.objects;

create policy media_read on storage.objects for select using (bucket_id = 'media');
create policy media_upload on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy media_update_own on storage.objects for update to authenticated
  using (bucket_id = 'media' and owner = (select auth.uid()))
  with check (bucket_id = 'media' and owner = (select auth.uid()));
create policy media_delete_own_or_mod on storage.objects for delete to authenticated using (
  bucket_id = 'media' and (owner = (select auth.uid()) or (select public.is_mod())));
