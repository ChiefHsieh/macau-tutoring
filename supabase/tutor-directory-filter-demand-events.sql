-- Homepage "近 30 日活躍需求": one row per tutor-directory「應用篩選」click.
-- Run in Supabase SQL Editor (safe to re-run).

create table if not exists public.tutor_directory_filter_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text
);

create index if not exists tutor_directory_filter_events_created_at_idx
  on public.tutor_directory_filter_events (created_at desc);

alter table public.tutor_directory_filter_events enable row level security;

drop policy if exists "tutor_directory_filter_events_select_public" on public.tutor_directory_filter_events;
create policy "tutor_directory_filter_events_select_public"
on public.tutor_directory_filter_events
for select
using (true);

-- Inserts are performed via service role in /api/platform/tutor-filter-apply only.
