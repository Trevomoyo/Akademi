-- ============================================================
-- AKADEMI SUPABASE SCHEMA
-- Safe to run multiple times (idempotent)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────
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

drop policy if exists "own_profile_select" on public.profiles;
drop policy if exists "own_profile_update" on public.profiles;
drop policy if exists "own_profile_insert" on public.profiles;

create policy "own_profile_select" on public.profiles for select using (auth.uid() = id);
create policy "own_profile_update" on public.profiles for update using (auth.uid() = id);
create policy "own_profile_insert" on public.profiles for insert with check (auth.uid() = id);

-- ── TOPIC PROGRESS ───────────────────────────────────────────
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

drop policy if exists "own_progress" on public.topic_progress;
create policy "own_progress" on public.topic_progress for all using (auth.uid() = user_id);

-- ── BADGES ───────────────────────────────────────────────────
create table if not exists public.user_badges (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

drop policy if exists "own_badges" on public.user_badges;
create policy "own_badges" on public.user_badges for all using (auth.uid() = user_id);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
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

drop policy if exists "own_subs_select" on public.subscriptions;
drop policy if exists "service_subs_all" on public.subscriptions;
create policy "own_subs_select" on public.subscriptions for select using (auth.uid() = user_id);
create policy "service_subs_all" on public.subscriptions for all using (auth.role() = 'service_role');

-- ── PAST PAPERS ──────────────────────────────────────────────
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

drop policy if exists "papers_public_read" on public.past_papers;
drop policy if exists "papers_service_write" on public.past_papers;
create policy "papers_public_read" on public.past_papers for select using (true);
create policy "papers_service_write" on public.past_papers for all using (auth.role() = 'service_role');

-- ── PHONE OTPs (kept for future use) ─────────────────────────
create table if not exists public.phone_otps (
  id          uuid primary key default uuid_generate_v4(),
  phone       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.phone_otps enable row level security;

drop policy if exists "service_otps" on public.phone_otps;
create policy "service_otps" on public.phone_otps for all using (auth.role() = 'service_role');

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_profiles_updated_at  on public.profiles;
drop trigger if exists trg_progress_updated_at  on public.topic_progress;
drop trigger if exists trg_subs_updated_at      on public.subscriptions;

create trigger trg_profiles_updated_at  before update on public.profiles      for each row execute procedure public.handle_updated_at();
create trigger trg_progress_updated_at  before update on public.topic_progress for each row execute procedure public.handle_updated_at();
create trigger trg_subs_updated_at      before update on public.subscriptions  for each row execute procedure public.handle_updated_at();

-- ── AUTH SETTINGS REMINDER ───────────────────────────────────
-- Go to Authentication → Settings in your Supabase dashboard and set:
--   "Enable email confirmations" = OFF
--   "Secure email change"        = OFF

-- ── CUSTOM TOPICS (admin-authored notes) ─────────────────────
create table if not exists public.custom_topics (
  id                uuid primary key default uuid_generate_v4(),
  subject_id        text not null,
  level             text not null check (level in ('o','a')),
  title             text not null,
  summary           text not null default '',
  content_markdown  text not null default '',
  mcqs              jsonb not null default '[]',
  essay_prompt      text,
  essay_rubric      jsonb not null default '[]',
  read_xp           integer not null default 10,
  is_override       boolean not null default false,
  override_topic_id text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.custom_topics enable row level security;

drop policy if exists "custom_topics_public_read" on public.custom_topics;
drop policy if exists "custom_topics_service_write" on public.custom_topics;

create policy "custom_topics_public_read"
  on public.custom_topics for select using (true);

create policy "custom_topics_service_write"
  on public.custom_topics for all using (auth.role() = 'service_role');

drop trigger if exists trg_custom_topics_updated_at on public.custom_topics;
create trigger trg_custom_topics_updated_at
  before update on public.custom_topics
  for each row execute procedure public.handle_updated_at();

-- ── STORAGE BUCKET (diagrams for notes) ──────────────────────
-- Creates a public bucket for lesson diagrams uploaded via the Admin panel
insert into storage.buckets (id, name, public)
values ('diagrams', 'diagrams', true)
on conflict (id) do nothing;

-- Anyone can view (public bucket, needed for students reading notes)
drop policy if exists "diagrams_public_read" on storage.objects;
create policy "diagrams_public_read"
  on storage.objects for select
  using (bucket_id = 'diagrams');

-- Only service role (server) can upload/delete — admin uploads go through the API
drop policy if exists "diagrams_service_write" on storage.objects;
create policy "diagrams_service_write"
  on storage.objects for insert
  with check (bucket_id = 'diagrams' and auth.role() = 'service_role');

drop policy if exists "diagrams_service_delete" on storage.objects;
create policy "diagrams_service_delete"
  on storage.objects for delete
  using (bucket_id = 'diagrams' and auth.role() = 'service_role');
