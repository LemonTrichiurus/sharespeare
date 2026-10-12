-- =====================================================================
-- Baseline: snapshot of the LIVE production schema (project cgzcucufhdhifsphxzpb)
-- Generated 2026-10-11 from the catalog (pg_class / pg_policies / grants),
-- NOT from the old hand-written supabase/*.sql files, which had drifted.
--
-- This file records reality as-is, including known problems (duplicate
-- policies, write policies with no matching grants, SECURITY DEFINER view).
-- Those are fixed in later migrations, not here.
-- =====================================================================

-- ---------- enums ----------
create type public.comment_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.event_source   as enum ('AP', 'UCLA', 'OTHER');
create type public.event_type     as enum ('EXAM', 'EVENT');
create type public.news_category  as enum ('CAMPUS', 'GLOBAL');
create type public.publish_status as enum ('DRAFT', 'PUBLISHED', 'PENDING', 'REJECTED');
create type public.role           as enum ('ADMIN', 'MOD', 'MEMBER');
create type public.topic_status   as enum ('OPEN', 'LOCKED');
create type public.visibility     as enum ('PUBLIC', 'PRIVATE');

-- ---------- sequences ----------
create sequence if not exists public.audit_logs_id_seq;
create sequence if not exists public.calendar_events_id_seq;
create sequence if not exists public.comments_id_seq;
create sequence if not exists public.homepage_config_id_seq;
create sequence if not exists public.news_id_seq;
create sequence if not exists public.sharespeare_id_seq;
create sequence if not exists public.topics_id_seq;

-- ---------- tables ----------
create table public.profiles (
  id uuid not null,
  email text,
  display_name text,
  avatar_url text,
  role role default 'MEMBER'::role not null,
  created_at timestamp with time zone default now() not null
);

create table public.news (
  id bigint default nextval('news_id_seq'::regclass) not null,
  title text not null,
  content_rich text not null,
  cover_url text,
  category news_category default 'CAMPUS'::news_category not null,
  status publish_status default 'DRAFT'::publish_status not null,
  author_id uuid not null,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_note text
);

create table public.sharespeare (
  id bigint default nextval('sharespeare_id_seq'::regclass) not null,
  title text not null,
  content_rich text not null,
  media_url text,
  status publish_status default 'DRAFT'::publish_status not null,
  author_id uuid not null,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_note text,
  media_urls jsonb default '[]'::jsonb,
  tags integer[] default '{}'::integer[]
);

create table public.topics (
  id bigint default nextval('topics_id_seq'::regclass) not null,
  title text not null,
  body_rich text not null,
  status topic_status default 'OPEN'::topic_status not null,
  author_id uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.comments (
  id bigint default nextval('comments_id_seq'::regclass) not null,
  topic_id bigint not null,
  author_id uuid not null,
  body_rich text not null,
  status comment_status default 'PENDING'::comment_status not null,
  moderated_by uuid,
  moderated_at timestamp with time zone,
  reason text,
  created_at timestamp with time zone default now() not null
);

create table public.calendar_events (
  id bigint default nextval('calendar_events_id_seq'::regclass) not null,
  title text not null,
  date date not null,
  type event_type default 'EXAM'::event_type not null,
  source event_source default 'OTHER'::event_source not null,
  description text,
  visibility visibility default 'PUBLIC'::visibility not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.audit_logs (
  id bigint default nextval('audit_logs_id_seq'::regclass) not null,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb,
  created_at timestamp with time zone default now() not null
);

create table public.homepage_config (
  id bigint default nextval('homepage_config_id_seq'::regclass) not null,
  config_key text not null,
  config_value text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.tags (
  id integer not null,
  name text not null,
  name_en text not null,
  description text,
  created_at timestamp with time zone default now() not null
);

alter sequence public.audit_logs_id_seq      owned by public.audit_logs.id;
alter sequence public.calendar_events_id_seq owned by public.calendar_events.id;
alter sequence public.comments_id_seq        owned by public.comments.id;
alter sequence public.homepage_config_id_seq owned by public.homepage_config.id;
alter sequence public.news_id_seq            owned by public.news.id;
alter sequence public.sharespeare_id_seq     owned by public.sharespeare.id;
alter sequence public.topics_id_seq          owned by public.topics.id;

-- ---------- primary keys / unique / check ----------
alter table public.audit_logs      add constraint audit_logs_pkey PRIMARY KEY (id);
alter table public.calendar_events add constraint calendar_events_pkey PRIMARY KEY (id);
alter table public.comments        add constraint comments_pkey PRIMARY KEY (id);
alter table public.homepage_config add constraint homepage_config_pkey PRIMARY KEY (id);
alter table public.homepage_config add constraint homepage_config_config_key_key UNIQUE (config_key);
alter table public.news            add constraint news_pkey PRIMARY KEY (id);
alter table public.news            add constraint news_published_requires_time CHECK (((status <> 'PUBLISHED'::publish_status) OR (published_at IS NOT NULL)));
alter table public.profiles        add constraint profiles_pkey PRIMARY KEY (id);
alter table public.profiles        add constraint profiles_email_key UNIQUE (email);
alter table public.sharespeare     add constraint sharespeare_pkey PRIMARY KEY (id);
alter table public.sharespeare     add constraint check_media_urls_is_array CHECK ((jsonb_typeof(media_urls) = 'array'::text));
alter table public.sharespeare     add constraint sharespeare_published_requires_time CHECK (((status <> 'PUBLISHED'::publish_status) OR (published_at IS NOT NULL)));
alter table public.tags            add constraint tags_pkey PRIMARY KEY (id);
alter table public.tags            add constraint tags_name_key UNIQUE (name);
alter table public.topics          add constraint topics_pkey PRIMARY KEY (id);

-- ---------- foreign keys ----------
-- NOTE: several author_id columns are NOT NULL but use ON DELETE SET NULL,
-- so deleting a user who has authored content currently fails.
alter table public.profiles        add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.audit_logs      add constraint audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.calendar_events add constraint calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.comments        add constraint comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.comments        add constraint comments_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES profiles(id);
alter table public.comments        add constraint comments_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;
alter table public.news            add constraint news_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.news            add constraint news_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id);
alter table public.sharespeare     add constraint sharespeare_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.sharespeare     add constraint sharespeare_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id);
alter table public.topics          add constraint topics_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ---------- indexes ----------
CREATE INDEX idx_calendar_date          ON public.calendar_events USING btree (date);
CREATE INDEX idx_comments_status        ON public.comments USING btree (status);
CREATE INDEX idx_comments_topic         ON public.comments USING btree (topic_id);
CREATE INDEX idx_news_published_at      ON public.news USING btree (published_at DESC);
CREATE INDEX idx_news_status            ON public.news USING btree (status);
CREATE INDEX idx_sharespeare_media_urls ON public.sharespeare USING gin (media_urls);
CREATE INDEX idx_sharespeare_tags_gin   ON public.sharespeare USING gin (tags);

-- ---------- functions ----------
create or replace function public.is_mod(u uuid default auth.uid())
returns boolean language sql stable as $$
  select exists(
    select 1 from public.profiles p
    where p.id = u and p.role in ('ADMIN','MOD')
  );
$$;

create or replace function public.is_admin(u uuid default auth.uid())
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id=u and p.role='ADMIN');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles(id, email, display_name)
  values (new.id, new.email, split_part(new.email,'@',1))
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.set_author_id()
returns trigger language plpgsql as $$
begin
  if new.author_id is null then new.author_id := auth.uid(); end if;
  return new;
end $$;

create or replace function public.set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'PUBLISHED'::public.publish_status
     and (old.status is distinct from 'PUBLISHED'::public.publish_status) then
    new.published_at := coalesce(new.published_at, now());
  elsif new.status <> 'PUBLISHED'::public.publish_status then
    new.published_at := null;
  end if;
  return new;
end $$;

create or replace function public.validate_sharespeare_tags()
returns trigger language plpgsql as $$
declare
  invalid_count integer;
begin
  -- 当 tags 不为空时，检查每个元素是否都存在
  if new.tags is not null then
    select count(*) into invalid_count
    from (
      select unnest(new.tags) as tag_id
    ) x
    left join public.tags t on t.id = x.tag_id
    where t.id is null;

    if invalid_count > 0 then
      raise exception 'Invalid tag_id in sharespeare.tags. All values must exist in public.tags(id).';
    end if;
  end if;

  return new;
end;
$$;

-- ---------- triggers ----------
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER news_set_author        BEFORE INSERT ON public.news        FOR EACH ROW EXECUTE FUNCTION set_author_id();
CREATE TRIGGER news_set_updated       BEFORE UPDATE ON public.news        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER news_published_at      BEFORE UPDATE ON public.news        FOR EACH ROW EXECUTE FUNCTION set_published_at();

CREATE TRIGGER share_set_author       BEFORE INSERT ON public.sharespeare FOR EACH ROW EXECUTE FUNCTION set_author_id();
CREATE TRIGGER sharespeare_set_updated BEFORE UPDATE ON public.sharespeare FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER share_published_at     BEFORE UPDATE ON public.sharespeare FOR EACH ROW EXECUTE FUNCTION set_published_at();
CREATE TRIGGER trg_validate_sharespeare_tags BEFORE INSERT OR UPDATE ON public.sharespeare FOR EACH ROW EXECUTE FUNCTION validate_sharespeare_tags();

CREATE TRIGGER topics_set_author      BEFORE INSERT ON public.topics      FOR EACH ROW EXECUTE FUNCTION set_author_id();
CREATE TRIGGER topics_set_updated     BEFORE UPDATE ON public.topics      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER comments_set_author    BEFORE INSERT ON public.comments    FOR EACH ROW EXECUTE FUNCTION set_author_id();

CREATE TRIGGER calendar_set_updated   BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- views ----------
-- NOTE: no security_invoker → runs with owner rights and bypasses RLS (leaks non-published rows).
create view public.v_sharespeare_with_tags as
 SELECT s.id,
    s.title,
    s.content_rich,
    s.media_url,
    s.status,
    s.author_id,
    s.published_at,
    s.created_at,
    s.updated_at,
    s.reviewed_by,
    s.reviewed_at,
    s.review_note,
    s.media_urls,
    s.tags,
    array_agg(t.name) FILTER (WHERE (t.id IS NOT NULL)) AS tag_names_zh,
    array_agg(t.name_en) FILTER (WHERE (t.id IS NOT NULL)) AS tag_names_en
   FROM ((sharespeare s
     LEFT JOIN LATERAL unnest(s.tags) tag_id(tag_id) ON (true))
     LEFT JOIN tags t ON ((t.id = tag_id.tag_id)))
  GROUP BY s.id;

-- ---------- row level security ----------
alter table public.audit_logs      enable row level security;
alter table public.calendar_events enable row level security;
alter table public.comments        enable row level security;
alter table public.homepage_config enable row level security;
alter table public.news            enable row level security;
alter table public.profiles        enable row level security;
alter table public.sharespeare     enable row level security;
alter table public.tags            enable row level security;
alter table public.topics          enable row level security;

-- profiles
create policy profiles_select_all on public.profiles for select to public using (true);
create policy profiles_update_own on public.profiles for update to public
  using ((auth.uid() = id)) with check ((auth.uid() = id));

-- news
create policy news_select_published on public.news for select to public
  using (((status = 'PUBLISHED'::publish_status) OR ((auth.uid() IS NOT NULL) AND ((author_id = auth.uid()) OR is_mod()))));
create policy news_insert_member_draft on public.news for insert to public
  with check (((auth.uid() IS NOT NULL) AND ((author_id IS NULL) OR (author_id = auth.uid())) AND (status = 'DRAFT'::publish_status)));
create policy news_insert_mod on public.news for insert to public
  with check ((is_mod() OR ((auth.uid() IS NOT NULL) AND (status = 'DRAFT'::publish_status))));
create policy news_update_author_draft on public.news for update to public
  using (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)))
  with check (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)));
create policy news_submit_author_draft_to_pending on public.news for update to public
  using (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)))
  with check (((author_id = auth.uid()) AND (status = 'PENDING'::publish_status)));
create policy news_rework_author_rejected_to_draft on public.news for update to public
  using (((author_id = auth.uid()) AND (status = 'REJECTED'::publish_status)))
  with check (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)));
create policy news_moderate_by_mod on public.news for update to public
  using (is_mod()) with check (is_mod());
create policy news_delete_admin on public.news for delete to public using (is_admin());
create policy news_delete_author_wip on public.news for delete to public
  using (((author_id = auth.uid()) AND (status = ANY (ARRAY['DRAFT'::publish_status, 'PENDING'::publish_status]))));

-- sharespeare
create policy share_select_published on public.sharespeare for select to public
  using (((status = 'PUBLISHED'::publish_status) OR ((auth.uid() IS NOT NULL) AND ((author_id = auth.uid()) OR is_mod()))));
create policy share_insert_member_draft on public.sharespeare for insert to public
  with check (((auth.uid() IS NOT NULL) AND ((author_id IS NULL) OR (author_id = auth.uid())) AND (status = 'DRAFT'::publish_status)));
create policy share_insert_mod on public.sharespeare for insert to public
  with check ((is_mod() OR ((auth.uid() IS NOT NULL) AND (status = 'DRAFT'::publish_status))));
create policy share_update_author_draft on public.sharespeare for update to public
  using (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)))
  with check (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)));
create policy share_submit_author_draft_to_pending on public.sharespeare for update to public
  using (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)))
  with check (((author_id = auth.uid()) AND (status = 'PENDING'::publish_status)));
create policy share_rework_author_rejected_to_draft on public.sharespeare for update to public
  using (((author_id = auth.uid()) AND (status = 'REJECTED'::publish_status)))
  with check (((author_id = auth.uid()) AND (status = 'DRAFT'::publish_status)));
create policy share_moderate_by_mod on public.sharespeare for update to public
  using (is_mod()) with check (is_mod());
create policy share_delete_admin on public.sharespeare for delete to public using (is_admin());
create policy share_delete_author_wip on public.sharespeare for delete to public
  using (((author_id = auth.uid()) AND (status = ANY (ARRAY['DRAFT'::publish_status, 'PENDING'::publish_status]))));

-- topics
create policy topics_select_open_or_mod on public.topics for select to public
  using (((status = 'OPEN'::topic_status) OR is_mod()));
create policy topics_insert_mod on public.topics for insert to public with check (is_mod());
create policy topics_update_mod on public.topics for update to public using (is_mod()) with check (is_mod());
create policy topics_delete_mod on public.topics for delete to public using (is_mod());

-- comments (contains duplicate pairs, as in production)
create policy comments_select_approved on public.comments for select to public
  using (((status = 'APPROVED'::comment_status) OR ((auth.uid() IS NOT NULL) AND ((author_id = auth.uid()) OR is_mod()))));
create policy comments_select_approved_or_own_or_mod on public.comments for select to public
  using (((status = 'APPROVED'::comment_status) OR ((auth.uid() IS NOT NULL) AND ((author_id = auth.uid()) OR is_mod()))));
create policy comments_insert_authenticated on public.comments for insert to public
  with check (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1 FROM topics t
    WHERE ((t.id = comments.topic_id) AND (t.status = 'OPEN'::topic_status))))));
create policy comments_insert_authenticated_open_topic on public.comments for insert to public
  with check (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1 FROM topics t
    WHERE ((t.id = comments.topic_id) AND (t.status = 'OPEN'::topic_status)))) AND (status = 'PENDING'::comment_status)));
create policy comments_update_own_pending on public.comments for update to public
  using ((((author_id = auth.uid()) AND (status = 'PENDING'::comment_status)) OR is_mod()))
  with check ((((author_id = auth.uid()) AND (status = 'PENDING'::comment_status)) OR is_mod()));
create policy comments_update_own_pending_or_mod on public.comments for update to public
  using ((((author_id = auth.uid()) AND (status = 'PENDING'::comment_status)) OR is_mod()))
  with check ((((author_id = auth.uid()) AND (status = 'PENDING'::comment_status)) OR is_mod()));
create policy comments_moderate_by_mod on public.comments for update to public
  using (is_mod()) with check (is_mod());
create policy comments_delete_own_pending on public.comments for delete to public
  using ((((author_id = auth.uid()) AND (status = 'PENDING'::comment_status)) OR is_mod()));
create policy comments_delete_own_pending_or_mod on public.comments for delete to public
  using ((((author_id = auth.uid()) AND (status = 'PENDING'::comment_status)) OR is_mod()));

-- calendar_events
create policy calendar_events_select_public on public.calendar_events for select to public
  using (((visibility = 'PUBLIC'::visibility) OR ((auth.uid() IS NOT NULL) AND ((created_by = auth.uid()) OR is_mod()))));
create policy calendar_events_insert_mod on public.calendar_events for insert to public with check (is_mod());
create policy calendar_events_update_mod on public.calendar_events for update to public using (is_mod()) with check (is_mod());
create policy calendar_events_delete_admin on public.calendar_events for delete to public using (is_admin());

-- homepage_config
create policy homepage_config_select_all on public.homepage_config for select to public using (true);
create policy homepage_config_write_mod on public.homepage_config for all to public using (is_mod()) with check (is_mod());

-- tags (duplicate pair, as in production)
create policy "Allow read access to tags"  on public.tags for select to public using (true);
create policy "Tags readable by everyone"  on public.tags for select to public using (true);

-- audit_logs: RLS enabled, no policies (service role only)

-- ---------- grants ----------
-- Production revokes all writes from anon/authenticated: only SELECT is granted,
-- so the write policies above are inert and every write must go through service_role.
grant select on public.audit_logs, public.calendar_events, public.comments, public.homepage_config,
  public.news, public.profiles, public.sharespeare, public.tags, public.topics,
  public.v_sharespeare_with_tags to anon, authenticated;
grant select, insert, update, delete, references, trigger, truncate on public.audit_logs, public.calendar_events,
  public.comments, public.homepage_config, public.news, public.profiles, public.sharespeare, public.tags,
  public.topics, public.v_sharespeare_with_tags to service_role;

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
  array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','application/pdf'])
on conflict (id) do nothing;

create policy media_public_read   on storage.objects for select to public using ((bucket_id = 'media'::text));
create policy media_select_all    on storage.objects for select to public using ((bucket_id = 'media'::text));
create policy "媒体文件公开可见"    on storage.objects for select to public using ((bucket_id = 'media'::text));
create policy media_authenticated_upload on storage.objects for insert to public
  with check (((bucket_id = 'media'::text) AND (auth.uid() IS NOT NULL)));
create policy "登录用户可上传媒体"  on storage.objects for insert to public
  with check (((bucket_id = 'media'::text) AND (auth.role() = 'authenticated'::text)));
create policy "用户可更新自己的媒体文件" on storage.objects for update to public
  using (((bucket_id = 'media'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
create policy media_owner_or_mod_delete on storage.objects for delete to public
  using (((bucket_id = 'media'::text) AND ((owner = auth.uid()) OR is_mod())));
