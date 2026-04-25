-- Tutor acceptance workflow for bookings.
-- Run once after schema.sql and notifications/messages scripts.

alter table public.bookings
  add column if not exists tutor_decision text
  check (tutor_decision in ('pending', 'accepted', 'rejected'))
  default 'pending';

update public.bookings
set tutor_decision = 'pending'
where tutor_decision is null;

create index if not exists bookings_tutor_decision_idx
  on public.bookings (tutor_id, tutor_decision, session_date);

create or replace function public.notify_student_on_tutor_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tutor_name text;
  v_title text;
  v_type text;
  v_body text;
begin
  if old.tutor_decision is not distinct from new.tutor_decision then
    return new;
  end if;

  if new.tutor_decision not in ('accepted', 'rejected') then
    return new;
  end if;

  v_tutor_name := coalesce(
    (select nullif(trim(display_name), '') from public.tutor_profiles where id = new.tutor_id),
    'Tutor'
  );

  if new.tutor_decision = 'accepted' then
    v_title := 'Booking accepted';
    v_type := 'booking_confirmed';
    v_body := v_tutor_name || ' accepted your booking on ' || new.session_date::text || '.';
  else
    v_title := 'Booking declined';
    v_type := 'booking_cancelled';
    v_body := v_tutor_name || ' declined your booking on ' || new.session_date::text || '.';
  end if;

  begin
    insert into public.notifications (user_id, type, title, content, related_id)
    values (new.student_id, v_type, v_title, v_body, new.id);
  exception
    when others then
      raise warning 'notify_student_on_tutor_decision: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_bookings_notify_student_decision on public.bookings;
create trigger trg_bookings_notify_student_decision
after update of tutor_decision on public.bookings
for each row
execute function public.notify_student_on_tutor_decision();
