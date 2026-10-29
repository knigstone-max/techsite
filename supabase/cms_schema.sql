-- TechnoBayit CMS schema (Supabase free tier). Safe to re-run.
-- Roles: admin > editor > writer. A profile with role NULL has no CMS access (new sign-ups wait for an admin).

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  role         text check (role in ('admin', 'editor', 'writer')),
  created_at   timestamptz not null default now()
);
alter table public.profiles add column if not exists role text check (role in ('admin', 'editor', 'writer'));
alter table public.profiles enable row level security;

-- Role of the current user. SECURITY DEFINER in a non-exposed schema avoids recursive RLS on profiles.
create or replace function private.cms_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;
create or replace function private.has_role(min_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (case private.cms_role() when 'admin' then 3 when 'editor' then 2 when 'writer' then 1 else 0 end)
    >= (case min_role when 'admin' then 3 when 'editor' then 2 when 'writer' then 1 else 99 end), false)
$$;
revoke all on function private.cms_role() from public;
revoke all on function private.has_role(text) from public;
grant execute on function private.cms_role() to anon, authenticated;
grant execute on function private.has_role(text) to anon, authenticated;

drop policy if exists "profiles are readable by everyone" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "profiles: read own or staff" on public.profiles;
create policy "profiles: read own or staff" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.has_role('writer')));
drop policy if exists "profiles: update own name or admin" on public.profiles;
create policy "profiles: update own name or admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.has_role('admin')))
  with check (id = (select auth.uid()) or (select private.has_role('admin')));

-- Only admins may change roles; the last admin cannot be demoted.
create or replace function private.guard_role_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role then
    -- auth.uid() is null for the SQL editor and the service role (Edge Function); those are trusted.
    if (select auth.uid()) is not null and not private.has_role('admin') then
      raise exception 'only admins can change roles';
    end if;
    if old.role = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'cannot remove the last admin';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function private.guard_role_change();

-- New auth users get a profile with no role.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 60), ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop function if exists public.handle_new_user() cascade;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------- posts ----------
create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  lang             text not null check (lang in ('he', 'en')),
  slug             text not null check (slug ~ '^[a-z0-9-]{1,120}$'),
  title            text not null check (char_length(title) between 1 and 300),
  excerpt          text not null default '' check (char_length(excerpt) <= 1000),
  body             text not null default '',
  category         text not null,
  image            text,
  image_alt        text,
  image_credit     text,
  image_credit_url text,
  image_position   text,
  source_links     jsonb not null default '[]'::jsonb check (jsonb_typeof(source_links) = 'array'),
  placeholder      boolean not null default false,
  status           text not null default 'draft' check (status in ('draft', 'published')),
  author_id        uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz,
  unique (lang, slug)
);
create index if not exists posts_status_pub_idx on public.posts (status, published_at desc);
create index if not exists posts_author_idx on public.posts (author_id);
alter table public.posts enable row level security;

create or replace function private.posts_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before insert or update on public.posts
  for each row execute function private.posts_touch();

drop policy if exists "posts: public reads published" on public.posts;
create policy "posts: public reads published" on public.posts for select to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()) or (select private.has_role('editor')));
drop policy if exists "posts: writers create" on public.posts;
create policy "posts: writers create" on public.posts for insert to authenticated
  with check ((select private.has_role('editor'))
           or ((select private.has_role('writer')) and author_id = (select auth.uid()) and status = 'draft'));
drop policy if exists "posts: edit" on public.posts;
create policy "posts: edit" on public.posts for update to authenticated
  using ((select private.has_role('editor'))
      or ((select private.has_role('writer')) and author_id = (select auth.uid()) and status = 'draft'))
  with check ((select private.has_role('editor'))
      or ((select private.has_role('writer')) and author_id = (select auth.uid()) and status = 'draft'));
drop policy if exists "posts: delete" on public.posts;
create policy "posts: delete" on public.posts for delete to authenticated
  using ((select private.has_role('editor'))
      or ((select private.has_role('writer')) and author_id = (select auth.uid()) and status = 'draft'));

-- ---------- post_registry: every (lang, slug) ever stored in the CMS ----------
-- The static build uses it so a deleted or unpublished CMS post never comes back from an old markdown file.
create table if not exists public.post_registry (
  lang text not null, slug text not null, first_seen timestamptz not null default now(),
  primary key (lang, slug)
);
alter table public.post_registry enable row level security;
drop policy if exists "registry: public read" on public.post_registry;
create policy "registry: public read" on public.post_registry for select to anon, authenticated using (true);

create or replace function private.posts_register()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.post_registry (lang, slug) values (new.lang, new.slug) on conflict do nothing;
  return new;
end $$;
drop trigger if exists posts_register on public.posts;
create trigger posts_register after insert or update of lang, slug on public.posts
  for each row execute function private.posts_register();

-- ---------- grants (Data API) ----------
grant select on public.posts, public.post_registry to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.post_registry to authenticated;
grant select, update on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
revoke all on public.profiles from anon;

-- ---------- storage: public bucket for post images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "post-images: staff read" on storage.objects;
create policy "post-images: staff read" on storage.objects for select to authenticated
  using (bucket_id = 'post-images' and (select private.has_role('writer')));
drop policy if exists "post-images: staff upload" on storage.objects;
create policy "post-images: staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (select private.has_role('writer')));
drop policy if exists "post-images: staff update" on storage.objects;
create policy "post-images: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'post-images' and (select private.has_role('writer')))
  with check (bucket_id = 'post-images' and (select private.has_role('writer')));
drop policy if exists "post-images: editors delete" on storage.objects;
create policy "post-images: editors delete" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (select private.has_role('editor')));

-- ---------- one-time admin bootstrap codes (RLS on, no policies: service role only) ----------
create table if not exists public.bootstrap_codes (
  code_hash text primary key, email text not null, created_at timestamptz not null default now()
);
alter table public.bootstrap_codes enable row level security;  -- no policies: only the service role can read it
revoke all on public.bootstrap_codes from anon, authenticated;
