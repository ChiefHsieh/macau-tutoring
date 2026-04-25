-- Macau Tutoring Marketplace MVP schema
-- Run in Supabase SQL editor

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('tutor', 'student', 'admin')),
  full_name text not null,
  phone text not null,
  whatsapp text unique,
  email text unique not null,
  created_at timestamptz default now(),
  is_verified boolean default false
);

create table if not exists tutor_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  district text not null check (district in ('Macau Peninsula', 'Taipa', 'Coloane')),
  exact_location text not null,
  hourly_rate integer not null check (hourly_rate >= 100),
  working_period_start date not null,
  working_period_end date not null,
  service_type text not null check (service_type in ('in-person', 'online', 'both')),
  education_background text not null,
  teaching_experience text,
  bio text,
  profile_photo text,
  is_verified boolean default false,
  average_rating numeric(3,2) default 0,
  total_reviews integer default 0,
  created_at timestamptz default now()
);

create table if not exists tutor_subjects (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  subject text not null,
  grade_level text not null,
  unique (tutor_id, subject, grade_level)
);

create table if not exists tutor_availability (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  unique (tutor_id, day_of_week, start_time)
);

-- One-off extra availability for a specific calendar date (not weekly).
create table if not exists tutor_availability_one_off (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  unique (tutor_id, session_date, start_time)
);

create index if not exists tutor_availability_one_off_tutor_date_idx
  on tutor_availability_one_off (tutor_id, session_date);

create table if not exists tutor_unavailability_blocks (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  student_id uuid references users(id) on delete cascade,
  subject text not null,
  grade_level text not null,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  hourly_rate integer not null,
  total_amount integer not null,
  commission_rate numeric(4,2) not null,
  commission_amount integer not null,
  tutor_payout integer not null,
  payment_status text not null check (payment_status in ('pending', 'paid', 'refunded', 'completed')),
  session_status text not null check (session_status in ('upcoming', 'completed', 'cancelled', 'no-show')),
  is_first_session boolean default false,
  is_recurring boolean default false,
  contact_unlocked boolean default false,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade unique,
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  student_id uuid references users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  amount integer not null,
  payment_method text not null,
  transaction_id text unique,
  status text not null,
  created_at timestamptz default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  total_amount integer not null,
  commission_deducted integer not null,
  net_payout integer not null,
  payout_date date not null,
  transaction_id text unique,
  status text not null,
  created_at timestamptz default now()
);

-- Verification documents (NOT public)
-- Store tutor documents in a separate table so students cannot read them.
create table if not exists tutor_verification_documents (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references tutor_profiles(id) on delete cascade,
  verification_document text,
  created_at timestamptz default now()
);

-- Parent lead capture (2-week MVP)
create table if not exists parent_leads (
  id uuid primary key default gen_random_uuid(),
  child_grade text not null,
  subject text not null,
  phone text not null,
  wechat text,
  notes text,
  lead_source text default 'unknown',
  district text,
  budget_max integer,
  created_at timestamptz default now()
);

-- Anonymized feed for marketing / tutor discovery (no phone or notes).
create table if not exists parent_lead_public_feed (
  lead_id uuid primary key references parent_leads (id) on delete cascade,
  child_grade text not null,
  subject text not null,
  district text,
  budget_max integer,
  created_at timestamptz not null default now()
);

create index if not exists parent_lead_public_feed_created_at_idx
  on parent_lead_public_feed (created_at desc);

create or replace function public.tg_parent_leads_mirror_to_public_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.parent_lead_public_feed (
    lead_id,
    child_grade,
    subject,
    district,
    budget_max,
    created_at
  )
  values (
    new.id,
    new.child_grade,
    new.subject,
    new.district,
    new.budget_max,
    coalesce(new.created_at, now())
  );
  return new;
end;
$$;

drop trigger if exists parent_leads_mirror_public_feed on public.parent_leads;
create trigger parent_leads_mirror_public_feed
after insert on public.parent_leads
for each row
execute function public.tg_parent_leads_mirror_to_public_feed();
