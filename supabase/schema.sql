-- Supabase schema for TechnoBayit accounts (free tier).
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run.
-- Tables: profiles, favorites, comments. Row Level Security is ON for all of them.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select using (true);          -- only display_name is stored here; no emails

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile row automatically for each new user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- favorites (private to owner) ----------
create table if not exists public.favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  post_slug  text not null check (post_slug ~ '^[a-z0-9-]{1,120}$'),
  post_lang  text not null check (post_lang in ('he', 'en')),
  post_title text check (post_title is null or char_length(post_title) <= 300),
  created_at timestamptz not null default now(),
  primary key (user_id, post_slug, post_lang)
);
alter table public.favorites enable row level security;

drop policy if exists "owner reads favorites" on public.favorites;
create policy "owner reads favorites"
  on public.favorites for select to authenticated using (auth.uid() = user_id);

drop policy if exists "owner adds favorites" on public.favorites;
create policy "owner adds favorites"
  on public.favorites for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "owner removes favorites" on public.favorites;
create policy "owner removes favorites"
  on public.favorites for delete to authenticated using (auth.uid() = user_id);

-- ---------- comments (public read, own write/delete) ----------
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  post_slug  text not null check (post_slug ~ '^[a-z0-9-]{1,120}$'),
  post_lang  text not null check (post_lang in ('he', 'en')),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_slug, post_lang, created_at);
alter table public.comments enable row level security;

drop policy if exists "comments are readable by everyone" on public.comments;
create policy "comments are readable by everyone"
  on public.comments for select using (true);

drop policy if exists "users add own comments" on public.comments;
create policy "users add own comments"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments"
  on public.comments for delete to authenticated using (auth.uid() = user_id);
-- No update policy: comments can't be edited, only deleted and re-posted.

-- Table privileges (Supabase grants these by default; listed so the intent is explicit).
grant select on public.profiles, public.comments to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant insert, delete on public.comments to authenticated;

-- =====================================================================
-- Roles and editorial workflow (additive; safe to re-run)
-- Roles: reader (default) < writer < editor < admin
-- =====================================================================

-- ---------- role column ----------
alter table public.profiles add column if not exists role text not null default 'reader';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_role_check check (role in ('reader', 'writer', 'editor', 'admin'));
  end if;
end $$;

-- ---------- helpers (security definer: read the caller's role without tripping RLS) ----------
create or replace function public.role_rank(r text)
returns int language sql immutable as $$
  select case r when 'admin' then 3 when 'editor' then 2 when 'writer' then 1 else 0 end;
$$;

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'reader');
$$;

-- has_role('editor') is true for editors and admins; has_role('writer') for writers, editors, admins.
create or replace function public.has_role(min_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.role_rank(public.current_role_name()) >= public.role_rank(min_role);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('admin');
$$;

revoke all on function public.current_role_name() from public;
revoke all on function public.has_role(text) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.role_rank(text) to anon, authenticated;
grant execute on function public.current_role_name(), public.has_role(text), public.is_admin() to anon, authenticated;

-- ---------- block self-promotion ----------
-- Only admins can change a role, and nobody can change their own role (avoids locking out the last admin).
-- Direct SQL from the Supabase SQL editor / service role (no auth.uid()) is allowed, so you can set the first admin.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;  -- SQL editor, migrations, service role
  end if;
  if tg_op = 'INSERT' then
    if new.role is distinct from 'reader' and not public.is_admin() then
      raise exception 'only admins can assign roles' using errcode = '42501';
    end if;
  elsif new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'only admins can change roles' using errcode = '42501';
    end if;
    if new.id = auth.uid() then
      raise exception 'admins cannot change their own role' using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before insert or update on public.profiles for each row execute function public.guard_profile_role();

-- Admins may update any profile (role changes go through the trigger above).
drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile"
  on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin user list with emails. Emails stay in auth.users; only admins can call this.
create or replace function public.admin_list_users(search text default '')
returns table (id uuid, email text, display_name text, role text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.role, p.created_at, u.last_sign_in_at
    from public.profiles p join auth.users u on u.id = p.id
    where coalesce(search, '') = ''
       or u.email ilike '%' || search || '%'
       or coalesce(p.display_name, '') ilike '%' || search || '%'
    order by public.role_rank(p.role) desc, p.created_at desc
    limit 200;
end; $$;
revoke all on function public.admin_list_users(text) from public, anon;
grant execute on function public.admin_list_users(text) to authenticated;

-- ---------- comment moderation ----------
drop policy if exists "editors delete any comment" on public.comments;
create policy "editors delete any comment"
  on public.comments for delete to authenticated using (public.has_role('editor'));

-- ---------- submissions (writer drafts -> editor review -> queue for publishing) ----------
create table if not exists public.submissions (
  id           bigint generated always as identity primary key,
  author_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title_he     text check (title_he is null or char_length(title_he) between 1 and 200),
  title_en     text check (title_en is null or char_length(title_en) between 1 and 200),
  body_he      text check (body_he is null or char_length(body_he) <= 20000),
  body_en      text check (body_en is null or char_length(body_en) <= 20000),
  category     text not null check (category in ('smartphones-gadgets', 'home-appliances', 'tech-news', 'reviews', 'tips')),
  image_url    text check (image_url is null or image_url ~ '^https://'),
  source_links text check (source_links is null or char_length(source_links) <= 4000),
  status       text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  review_note  text check (review_note is null or char_length(review_note) <= 2000),
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint submissions_has_title check (title_he is not null or title_en is not null)
);
create index if not exists submissions_status_idx on public.submissions (status, updated_at desc);
create index if not exists submissions_author_idx on public.submissions (author_id, updated_at desc);
alter table public.submissions enable row level security;

-- Writers: see/create/edit their own (draft, pending, rejected); can only set draft or pending.
-- Editors and admins: see everything, approve or reject.
drop policy if exists "read own or review all submissions" on public.submissions;
create policy "read own or review all submissions"
  on public.submissions for select to authenticated
  using (author_id = auth.uid() or public.has_role('editor'));

drop policy if exists "writers create submissions" on public.submissions;
create policy "writers create submissions"
  on public.submissions for insert to authenticated
  with check (public.has_role('writer') and author_id = auth.uid() and status in ('draft', 'pending'));

drop policy if exists "writers edit own unapproved submissions" on public.submissions;
create policy "writers edit own unapproved submissions"
  on public.submissions for update to authenticated
  using (author_id = auth.uid() and public.has_role('writer') and status in ('draft', 'pending', 'rejected'))
  with check (author_id = auth.uid() and status in ('draft', 'pending'));

drop policy if exists "editors review submissions" on public.submissions;
create policy "editors review submissions"
  on public.submissions for update to authenticated
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists "delete own drafts or admin deletes any" on public.submissions;
create policy "delete own drafts or admin deletes any"
  on public.submissions for delete to authenticated
  using ((author_id = auth.uid() and status = 'draft') or public.is_admin());

-- Keep review fields honest: only editors set approved/rejected; reviewer + time are stamped here.
create or replace function public.guard_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.author_id := old.author_id;      -- authorship can't be reassigned
    new.created_at := old.created_at;
  end if;
  if new.status in ('approved', 'rejected') then
    if not public.has_role('editor') then
      raise exception 'only editors can approve or reject' using errcode = '42501';
    end if;
    if tg_op = 'INSERT' or new.status is distinct from old.status then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
  elsif not public.has_role('editor') then
    new.reviewed_by := case when tg_op = 'UPDATE' then old.reviewed_by end;
    new.reviewed_at := case when tg_op = 'UPDATE' then old.reviewed_at end;
    new.review_note := case when tg_op = 'UPDATE' then old.review_note end;
  end if;
  return new;
end; $$;

drop trigger if exists submissions_guard on public.submissions;
create trigger submissions_guard
  before insert or update on public.submissions for each row execute function public.guard_submission();

grant select, insert, update, delete on public.submissions to authenticated;

-- ---------- make the first admin ----------
-- Sign up on the site first (so the user exists), then run this once in the SQL editor
-- with your own email. The role trigger allows it because the SQL editor has no auth.uid().
--
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'you@example.com');
--
-- Check:  select p.role, u.email from public.profiles p join auth.users u on u.id = p.id where p.role <> 'reader';
