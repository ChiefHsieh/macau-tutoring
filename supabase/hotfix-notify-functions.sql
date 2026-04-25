-- Minimal hotfix: override only 2 functions + 2 triggers.
-- Safe to run multiple times.

create or replace function public.notify_tutor_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_notice text;
begin
  v_booking_notice :=
    coalesce(
      (select coalesce(nullif(trim(u.full_name), ''), 'Student')
       from public.users u
       where u.id = new.student_id),
      'Student'
    )
    || ' requested '
    || coalesce(new.subject, 'a session')
    || ' on '
    || new.session_date::text
    || ' '
    || left(new.start_time::text, 5)
    || '–'
    || left(new.end_time::text, 5)
    || '. Payment: '
    || new.payment_status
    || '.';

  begin
    insert into public.notifications (user_id, type, title, content, related_id)
    values (
      new.tutor_id,
      'booking_request',
      'New booking request',
      v_booking_notice,
      new.id
    );
  exception
    when others then
      raise warning 'notify_tutor_on_booking: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_bookings_notify_tutor on public.bookings;
create trigger trg_bookings_notify_tutor
after insert on public.bookings
for each row
execute function public.notify_tutor_on_booking();

create or replace function public.notify_receiver_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preview text;
  v_notice_body text;
begin
  -- Skip automated booking opener line.
  if position('[Platform booking]' in trim(new.content)) = 1 then
    return new;
  end if;

  v_preview := left(trim(new.content), 240);
  if length(v_preview) < length(trim(new.content)) then
    v_preview := v_preview || '…';
  end if;

  v_notice_body :=
    coalesce(
      (select coalesce(nullif(trim(u.full_name), ''), 'Someone')
       from public.users u
       where u.id = new.sender_id),
      'Someone'
    )
    || ': '
    || v_preview;

  begin
    insert into public.notifications (user_id, type, title, content, related_id)
    values (
      new.receiver_id,
      'new_message',
      'New message',
      v_notice_body,
      new.id
    );
  exception
    when others then
      raise warning 'notify_receiver_on_message: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_messages_notify_receiver on public.messages;
create trigger trg_messages_notify_receiver
after insert on public.messages
for each row
execute function public.notify_receiver_on_message();
