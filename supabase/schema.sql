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
