-- Run once on existing Supabase projects: single-date extra availability for tutors.

create table if not exists public.tutor_availability_one_off (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references public.tutor_profiles (id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  unique (tutor_id, session_date, start_time)
);

create index if not exists tutor_availability_one_off_tutor_date_idx
  on public.tutor_availability_one_off (tutor_id, session_date);

alter table public.tutor_availability_one_off enable row level security;

drop policy if exists "tutor_availability_one_off_select_public" on public.tutor_availability_one_off;
create policy "tutor_availability_one_off_select_public"
on public.tutor_availability_one_off
for select
using (true);

drop policy if exists "tutor_availability_one_off_insert_own" on public.tutor_availability_one_off;
create policy "tutor_availability_one_off_insert_own"
on public.tutor_availability_one_off
for insert
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_availability_one_off_update_own" on public.tutor_availability_one_off;
create policy "tutor_availability_one_off_update_own"
on public.tutor_availability_one_off
for update
using (tutor_id = auth.uid() and public.is_tutor())
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_availability_one_off_delete_own" on public.tutor_availability_one_off;
create policy "tutor_availability_one_off_delete_own"
on public.tutor_availability_one_off
for delete
using (tutor_id = auth.uid() and public.is_tutor());
