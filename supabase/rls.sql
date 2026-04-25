-- Macau Tutoring Marketplace - MVP Row Level Security (RLS)
-- Run after `schema.sql`

-- Helper role checks based on `public.users.role`
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;

create or replace function public.is_tutor()
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'tutor'
  );
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'student'
  );
$$;

-- Enable RLS
alter table public.users enable row level security;
alter table public.tutor_profiles enable row level security;
alter table public.tutor_subjects enable row level security;
alter table public.tutor_availability enable row level security;
alter table public.tutor_unavailability_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.tutor_verification_documents enable row level security;
alter table public.parent_leads enable row level security;

-- users
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin"
on public.users
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users
for insert
with check (id = auth.uid() and role in ('tutor', 'student', 'admin'));

drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin"
on public.users
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "users_delete_admin_only" on public.users;
create policy "users_delete_admin_only"
on public.users
for delete
using (public.is_admin());

-- tutor_profiles
drop policy if exists "tutor_profiles_select_public" on public.tutor_profiles;
create policy "tutor_profiles_select_public"
on public.tutor_profiles
for select
using (true);

drop policy if exists "tutor_profiles_upsert_own_or_admin" on public.tutor_profiles;
create policy "tutor_profiles_upsert_own_or_admin"
on public.tutor_profiles
for insert
with check (id = auth.uid() and (public.is_tutor() or public.is_admin()));

drop policy if exists "tutor_profiles_update_own_or_admin" on public.tutor_profiles;
create policy "tutor_profiles_update_own_or_admin"
on public.tutor_profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "tutor_profiles_delete_own_or_admin" on public.tutor_profiles;
create policy "tutor_profiles_delete_own_or_admin"
on public.tutor_profiles
for delete
using (id = auth.uid() or public.is_admin());

-- tutor_subjects
drop policy if exists "tutor_subjects_select_public" on public.tutor_subjects;
create policy "tutor_subjects_select_public"
on public.tutor_subjects
for select
using (true);

drop policy if exists "tutor_subjects_write_own_tutor" on public.tutor_subjects;
create policy "tutor_subjects_write_own_tutor"
on public.tutor_subjects
for insert
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_subjects_update_own_tutor" on public.tutor_subjects;
create policy "tutor_subjects_update_own_tutor"
on public.tutor_subjects
for update
using (tutor_id = auth.uid() and public.is_tutor())
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_subjects_delete_own_tutor" on public.tutor_subjects;
create policy "tutor_subjects_delete_own_tutor"
on public.tutor_subjects
for delete
using (tutor_id = auth.uid() and public.is_tutor());

-- tutor_availability
drop policy if exists "tutor_availability_select_public" on public.tutor_availability;
create policy "tutor_availability_select_public"
on public.tutor_availability
for select
using (true);

drop policy if exists "tutor_availability_write_own_tutor" on public.tutor_availability;
create policy "tutor_availability_write_own_tutor"
on public.tutor_availability
for insert
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_availability_update_own_tutor" on public.tutor_availability;
create policy "tutor_availability_update_own_tutor"
on public.tutor_availability
for update
using (tutor_id = auth.uid() and public.is_tutor())
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_availability_delete_own_tutor" on public.tutor_availability;
create policy "tutor_availability_delete_own_tutor"
on public.tutor_availability
for delete
using (tutor_id = auth.uid() and public.is_tutor());

alter table if exists public.tutor_availability_one_off enable row level security;

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

-- tutor_unavailability_blocks
drop policy if exists "tutor_blocks_select_public" on public.tutor_unavailability_blocks;
create policy "tutor_blocks_select_public"
on public.tutor_unavailability_blocks
for select
using (true);

drop policy if exists "tutor_blocks_insert_own_tutor" on public.tutor_unavailability_blocks;
create policy "tutor_blocks_insert_own_tutor"
on public.tutor_unavailability_blocks
for insert
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_blocks_update_own_tutor" on public.tutor_unavailability_blocks;
create policy "tutor_blocks_update_own_tutor"
on public.tutor_unavailability_blocks
for update
using (tutor_id = auth.uid() and public.is_tutor())
with check (tutor_id = auth.uid() and public.is_tutor());

drop policy if exists "tutor_blocks_delete_own_tutor" on public.tutor_unavailability_blocks;
create policy "tutor_blocks_delete_own_tutor"
on public.tutor_unavailability_blocks
for delete
using (tutor_id = auth.uid() and public.is_tutor());

-- bookings
drop policy if exists "bookings_select_parties_or_admin" on public.bookings;
create policy "bookings_select_parties_or_admin"
on public.bookings
for select
using (
  tutor_id = auth.uid()
  or student_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "bookings_insert_student_self" on public.bookings;
create policy "bookings_insert_student_self"
on public.bookings
for insert
with check (student_id = auth.uid() and public.is_student());

drop policy if exists "bookings_update_admin_or_tutor_or_pending_student" on public.bookings;
create policy "bookings_update_admin_or_tutor_or_pending_student"
on public.bookings
for update
using (
  public.is_admin()
  or tutor_id = auth.uid()
  or (
    student_id = auth.uid()
    and payment_status = 'pending'
    and session_status = 'upcoming'
  )
)
with check (
  public.is_admin()
  or tutor_id = auth.uid()
  or (
    student_id = auth.uid()
    and payment_status = 'pending'
    and session_status = 'upcoming'
  )
);

-- reviews
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
on public.reviews
for select
using (true);

drop policy if exists "reviews_insert_student_self" on public.reviews;
create policy "reviews_insert_student_self"
on public.reviews
for insert
with check (student_id = auth.uid() and public.is_student());

drop policy if exists "reviews_update_admin_only" on public.reviews;
create policy "reviews_update_admin_only"
on public.reviews
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reviews_delete_admin_only" on public.reviews;
create policy "reviews_delete_admin_only"
on public.reviews
for delete
using (public.is_admin());

-- payments (insert/update done by server/edge using service role)
drop policy if exists "payments_select_parties_or_admin" on public.payments;
create policy "payments_select_parties_or_admin"
on public.payments
for select
using (
  exists (
    select 1
    from public.bookings b
    where b.id = payments.booking_id
      and (
        b.student_id = auth.uid()
        or b.tutor_id = auth.uid()
        or public.is_admin()
      )
  )
);

drop policy if exists "payments_insert_admin_only" on public.payments;
create policy "payments_insert_admin_only"
on public.payments
for insert
with check (public.is_admin());

drop policy if exists "payments_update_admin_only" on public.payments;
create policy "payments_update_admin_only"
on public.payments
for update
using (public.is_admin())
with check (public.is_admin());

-- payouts
drop policy if exists "payouts_select_tutor_or_admin" on public.payouts;
create policy "payouts_select_tutor_or_admin"
on public.payouts
for select
using (tutor_id = auth.uid() or public.is_admin());

drop policy if exists "payouts_insert_admin_only" on public.payouts;
create policy "payouts_insert_admin_only"
on public.payouts
for insert
with check (public.is_admin());

drop policy if exists "payouts_update_admin_only" on public.payouts;
create policy "payouts_update_admin_only"
on public.payouts
for update
using (public.is_admin())
with check (public.is_admin());

-- tutor_verification_documents (private)
-- Students/parents never get access to verification documents.
drop policy if exists "tutor_verification_select_own_or_admin" on public.tutor_verification_documents;
create policy "tutor_verification_select_own_or_admin"
on public.tutor_verification_documents
for select
using (
  tutor_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "tutor_verification_insert_own_or_admin" on public.tutor_verification_documents;
create policy "tutor_verification_insert_own_or_admin"
on public.tutor_verification_documents
for insert
with check (
  public.is_admin()
  or (tutor_id = auth.uid() and public.is_tutor())
);

drop policy if exists "tutor_verification_update_own_or_admin" on public.tutor_verification_documents;
create policy "tutor_verification_update_own_or_admin"
on public.tutor_verification_documents
for update
using (
  public.is_admin()
  or tutor_id = auth.uid()
)
with check (
  public.is_admin()
  or (tutor_id = auth.uid() and public.is_tutor())
);

drop policy if exists "tutor_verification_delete_own_or_admin" on public.tutor_verification_documents;
create policy "tutor_verification_delete_own_or_admin"
on public.tutor_verification_documents
for delete
using (
  public.is_admin()
  or tutor_id = auth.uid()
);

-- parent_leads (public insert for lead capture; admin-only reads)
drop policy if exists "parent_leads_insert_public" on public.parent_leads;
create policy "parent_leads_insert_public"
on public.parent_leads
for insert
with check (
  length(trim(child_grade)) > 0
  and length(trim(subject)) > 0
  and length(trim(phone)) > 0
);

drop policy if exists "parent_leads_select_admin_only" on public.parent_leads;
create policy "parent_leads_select_admin_only"
on public.parent_leads
for select
using (public.is_admin());

drop policy if exists "parent_leads_update_admin_only" on public.parent_leads;
create policy "parent_leads_update_admin_only"
on public.parent_leads
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "parent_leads_delete_admin_only" on public.parent_leads;
create policy "parent_leads_delete_admin_only"
on public.parent_leads
for delete
using (public.is_admin());

-- parent_lead_public_feed (PII-free mirror; public read)
alter table if exists public.parent_lead_public_feed enable row level security;

drop policy if exists "parent_lead_public_feed_select_public" on public.parent_lead_public_feed;
create policy "parent_lead_public_feed_select_public"
on public.parent_lead_public_feed
for select
using (true);

