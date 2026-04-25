-- Run AFTER `notifications-messages.sql`.
--
-- 1) If you created `notify_receiver_on_message` BEFORE the repo added the "[Platform booking]" skip,
--    re-run the full `create or replace function public.notify_receiver_on_message()` block from
--    notifications-messages.sql (or run the whole file — it is mostly idempotent).
-- 2) Then run this file once to add the seed trigger.
--
-- Effect: each new booking inserts one student→tutor message so /messages inbox shows a thread;
-- duplicate "new_message" notification is suppressed for that automated line (tutor still has booking_request).

create or replace function public.seed_opening_message_after_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_body text;
begin
  v_body :=
    '[Platform booking] '
    || '我已透過平台發起預約（待支付）：'
    || new.session_date::text
    || ' '
    || left(new.start_time::text, 5)
    || '–'
    || left(new.end_time::text, 5)
    || '，科目：'
    || coalesce(nullif(trim(new.subject), ''), '—')
    || '。請在控制台查看詳情，或直接在此回覆。'
    || E'\n'
    || '[Platform booking] I created a booking on the platform (payment pending): '
    || new.session_date::text
    || ' '
    || left(new.start_time::text, 5)
    || '–'
    || left(new.end_time::text, 5)
    || ', subject: '
    || coalesce(nullif(trim(new.subject), ''), '—')
    || '. Please check your dashboard or reply here.';

  begin
    insert into public.messages (sender_id, receiver_id, booking_id, content)
    values (new.student_id, new.tutor_id, new.id, v_body);
  exception
    when others then
      raise warning 'seed_opening_message_after_booking: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_bookings_seed_opening_message on public.bookings;
create trigger trg_bookings_seed_opening_message
after insert on public.bookings
for each row
execute function public.seed_opening_message_after_booking();
