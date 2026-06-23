-- ============================================================
-- AKADEMI SUPABASE SCHEMA
-- Run this once in Supabase SQL Editor → New Query
-- ============================================================

create extension if not exists "uuid-ossp";

-- PROFILES (linked to auth.users)
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  name                    text not null,
  phone                   text,
  school                  text,
  city                    text,
  level                   text not null check (level in ('o','a')),
  subjects                text[] not null default '{}',
  xp                      integer not null default 0,
  login_streak            integer not null default 0,
  last_login_date         timestamptz,
  subscription_status     text not null default 'trial' check (subscription_status in ('active','trial','expired')),
  subscription_expires_at timestamptz,
  is_admin                boolean not null default false,
  theme                   text not null default 'light' check (theme in ('light','dark')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "own_profile_select" on public.profiles for select using (auth.uid() = id);
create policy "own_profile_update" on public.profiles for update using (auth.uid() = id);
create policy "own_profile_insert" on public.profiles for insert with check (auth.uid() = id);

-- TOPIC PROGRESS
create table if not exists public.topic_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  topic_id      text not null,
  read_complete boolean not null default false,
  mcq_score     integer not null default 0,
  essay_score   integer,
  updated_at    timestamptz not null default now(),
  unique(user_id, topic_id)
);

alter table public.topic_progress enable row level security;
create policy "own_progress" on public.topic_progress for all using (auth.uid() = user_id);

-- BADGES
create table if not exists public.user_badges (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;
create policy "own_badges" on public.user_badges for all using (auth.uid() = user_id);

-- SUBSCRIPTIONS (server-side managed)
create table if not exists public.subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  poll_token   text not null unique,
  paynow_ref   text,
  amount       numeric not null,
  currency     text not null,
  method       text not null,
  status       text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "own_subs_select" on public.subscriptions for select using (auth.uid() = user_id);
create policy "service_subs_all" on public.subscriptions for all using (auth.role() = 'service_role');

-- PAST PAPERS (admin-managed, public-read)
create table if not exists public.past_papers (
  id           uuid primary key default uuid_generate_v4(),
  subject_id   text not null,
  year         integer not null,
  paper_number integer not null,
  level        text not null check (level in ('o','a')),
  file_url     text,
  title        text,
  created_at   timestamptz not null default now()
);

alter table public.past_papers enable row level security;
create policy "papers_public_read" on public.past_papers for select using (true);
create policy "papers_service_write" on public.past_papers for all using (auth.role() = 'service_role');

-- UPDATED_AT TRIGGER
create or replace function public.handle_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger trg_profiles_updated_at   before update on public.profiles       for each row execute procedure public.handle_updated_at();
create trigger trg_progress_updated_at   before update on public.topic_progress  for each row execute procedure public.handle_updated_at();
create trigger trg_subs_updated_at       before update on public.subscriptions   for each row execute procedure public.handle_updated_at();

-- ── PHONE OTPs (custom auth via Africa's Talking) ────────────
-- Add this table to your existing schema
create table if not exists public.phone_otps (
  id          uuid primary key default uuid_generate_v4(),
  phone       text not null,
  code_hash   text not null,           -- bcrypt hash of the 6-digit code
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Only service role can read/write OTPs (never exposed to browser)
alter table public.phone_otps enable row level security;
create policy "service_otps" on public.phone_otps for all using (auth.role() = 'service_role');

-- Auto-clean expired OTPs (run this in Supabase as a cron or just let them accumulate)
-- DELETE FROM phone_otps WHERE expires_at < now();

-- ── AUTH SETTINGS (run in Supabase Dashboard) ────────────────
-- Go to Authentication → Settings and set:
--   "Enable email confirmations" = OFF
--   "Secure email change" = OFF
-- This allows sign-up to work without users needing to verify an email.
-- Since we're using username-derived internal emails, there's nothing to verify.
