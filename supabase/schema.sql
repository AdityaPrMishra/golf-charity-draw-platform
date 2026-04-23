-- Golf Charity Draw Platform — Supabase schema (PRD-aligned)
-- Run this in Supabase SQL Editor (new project).

-- Extensions
create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  website_url text,
  is_featured boolean default false,
  upcoming_events jsonb,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role text default 'subscriber' check (role in ('subscriber', 'admin')),
  subscription_status text check (subscription_status in ('active', 'inactive', 'cancelled', 'lapsed')),
  subscription_plan text check (subscription_plan in ('monthly', 'yearly')),
  subscription_renewal_date timestamptz,
  stripe_customer_id text,
  charity_id uuid references public.charities(id),
  charity_contribution_percent integer default 10 check (charity_contribution_percent between 10 and 100),
  created_at timestamptz default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  score integer not null check (score between 1 and 45),
  score_date date not null,
  created_at timestamptz default now(),
  unique(user_id, score_date)
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null,
  status text default 'pending' check (status in ('pending', 'simulated', 'published')),
  draw_type text default 'random' check (draw_type in ('random', 'algorithmic')),
  drawn_numbers integer[],
  jackpot_rollover boolean default false,
  jackpot_amount numeric default 0,
  total_prize_pool numeric,
  prize_pool_5match numeric,
  prize_pool_4match numeric,
  prize_pool_3match numeric,
  created_at timestamptz default now(),
  unique(draw_month)
);

create table if not exists public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references public.draws(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  user_scores integer[],
  match_count integer check (match_count in (0, 3, 4, 5)),
  is_winner boolean default false,
  prize_amount numeric default 0,
  verification_status text check (verification_status in ('pending', 'approved', 'rejected')),
  proof_url text,
  payout_status text default 'unpaid' check (payout_status in ('unpaid', 'paid')),
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  plan text check (plan in ('monthly', 'yearly')),
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.charity_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  charity_id uuid references public.charities(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric not null,
  contribution_percent integer,
  period_date date,
  created_at timestamptz default now()
);

-- =========================
-- Auth -> Profiles trigger
-- =========================

-- If you previously created a trigger from some template, drop it so we control behavior.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- Row Level Security (minimal starter)
-- =========================

alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.charity_contributions enable row level security;

-- profiles: user can read/update own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- scores: user owns their rows
drop policy if exists "scores_select_own" on public.scores;
create policy "scores_select_own"
on public.scores for select
using (auth.uid() = user_id);

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own"
on public.scores for insert
with check (auth.uid() = user_id);

drop policy if exists "scores_update_own" on public.scores;
create policy "scores_update_own"
on public.scores for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "scores_delete_own" on public.scores;
create policy "scores_delete_own"
on public.scores for delete
using (auth.uid() = user_id);

-- charities: public read
drop policy if exists "charities_select_public" on public.charities;
create policy "charities_select_public"
on public.charities for select
using (true);

