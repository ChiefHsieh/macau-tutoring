-- When a student creates a booking, mirror an anonymized row into parent_leads so the
-- existing trigger `parent_leads_mirror_public_feed` populates `parent_lead_public_feed`
-- for the landing page "最近家長需求" strip (no PII: phone is a synthetic token).
--
-- Run this in Supabase SQL Editor after `parent-lead-public-feed.sql` / schema triggers exist.
-- Safe to re-run: uses OR REPLACE and drops/recreates the trigger.

create or replace function public.tg_booking_append_recent_demand_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_district text;
  v_phone text;
begin
  select tp.district into v_district from public.tutor_profiles tp where tp.id = new.tutor_id limit 1;
  v_phone := 'booking-' || new.id::text;

  insert into public.parent_leads (
    child_grade,
    subject,
    phone,
    lead_source,
    district,
    budget_max,
    notes
  ) values (
    new.grade_level,
    new.subject,
    v_phone,
    'booking',
    v_district,
    new.hourly_rate,
    'auto-from-booking:' || new.id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_booking_recent_demand on public.bookings;
create trigger trg_booking_recent_demand
after insert on public.bookings
for each row
execute function public.tg_booking_append_recent_demand_feed();
