-- New profiles take their display name and avatar from the sign-up metadata:
-- `display_name` from the email sign-up form, or `full_name`/`name` and
-- `avatar_url`/`picture` from Google. Falls back to the email's local part.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    left(coalesce(
      nullif(trim(meta->>'display_name'), ''),
      nullif(trim(meta->>'full_name'), ''),
      nullif(trim(meta->>'name'), ''),
      split_part(new.email, '@', 1)
    ), 40),
    coalesce(meta->>'avatar_url', meta->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
