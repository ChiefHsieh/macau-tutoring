-- In-app notifications + private messages (run in Supabase SQL Editor after schema + RLS base).
-- Please run this file as a whole statement set (do not run isolated INSERT snippets from inside functions).
-- Booking insert -> tutor notification (trigger). Message insert -> receiver notification (trigger).
-- Email: configure Edge Function + secrets separately (see supabase/functions/new-booking-alert/README.md).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (
    type in (
      'booking_request',
      'booking_confirmed',
      'booking_cancelled',
      'new_message',
      'system'
    )
  ),
  title text not null,
  content text not null,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where is_read = false;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users (id) on delete cascade,
  receiver_id uuid not null references public.users (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint messages_no_self check (sender_id <> receiver_id)
);

create index if not exists messages_thread_idx
  on public.messages (sender_id, receiver_id, created_at desc);

create index if not exists messages_receiver_unread_idx
  on public.messages (receiver_id, created_at desc)
  where is_read = false;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.messages enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications
for delete
using (user_id = auth.uid());

-- Inserts only via SECURITY DEFINER triggers (no direct client INSERT policy).

drop policy if exists "messages_select_parties" on public.messages;
create policy "messages_select_parties"
on public.messages
for select
using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "messages_insert_as_sender" on public.messages;
create policy "messages_insert_as_sender"
on public.messages
for insert
with check (sender_id = auth.uid());

drop policy if exists "messages_update_receiver_read" on public.messages;
create policy "messages_update_receiver_read"
on public.messages
for update
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Triggers: in-app notifications (never fail parent row)
-- ---------------------------------------------------------------------------
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
  -- Automated booking opener (see booking-thread-opening-message.sql); tutor already gets booking_request.
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

-- Receivers may only flip is_read (RLS already limits UPDATE to receiver).
create or replace function public.messages_enforce_read_only_fields()
returns trigger
language plpgsql
as $$
begin
  if old.sender_id is distinct from new.sender_id
     or old.receiver_id is distinct from new.receiver_id
     or old.booking_id is distinct from new.booking_id
     or old.content is distinct from new.content
     or old.created_at is distinct from new.created_at
  then
    raise exception 'messages: only is_read may be updated';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_messages_enforce_patch on public.messages;
create trigger trg_messages_enforce_patch
before update on public.messages
for each row
execute function public.messages_enforce_read_only_fields();

-- ---------------------------------------------------------------------------
-- Realtime / postgres_changes (NOT the Replication read replica page)
-- See: realtime-publication-messages.sql
-- Dashboard: Database -> Publications -> supabase_realtime -> enable `messages`
--
-- Auto opening message after booking: booking-thread-opening-message.sql
-- (keep skip logic in notify_receiver_on_message consistent with that file)
-- In-app notifications + private messages (run in Supabase SQL Editor after schema + RLS base).
-- 请整段执行本文件；不要单独复制函数体内的 INSERT 到编辑器运行（否则未声明变量会被当成表名而报 42P01）。
-- Booking insert → tutor notification (trigger). Message insert → receiver notification (trigger).
-- Email: configure Edge Function + secrets separately (see supabase/functions/new-booking-alert/README.md).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (
    type in (
      'booking_request',
      'booking_confirmed',
      'booking_cancelled',
      'new_message',
      'system'
    )
  ),
  title text not null,
  content text not null,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where is_read = false;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users (id) on delete cascade,
  receiver_id uuid not null references public.users (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint messages_no_self check (sender_id <> receiver_id)
);

create index if not exists messages_thread_idx
  on public.messages (sender_id, receiver_id, created_at desc);

create index if not exists messages_receiver_unread_idx
  on public.messages (receiver_id, created_at desc)
  where is_read = false;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.messages enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications
for delete
using (user_id = auth.uid());

-- Inserts only via SECURITY DEFINER triggers (no direct client INSERT policy).

drop policy if exists "messages_select_parties" on public.messages;
create policy "messages_select_parties"
on public.messages
for select
using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "messages_insert_as_sender" on public.messages;
create policy "messages_insert_as_sender"
on public.messages
for insert
with check (sender_id = auth.uid());

drop policy if exists "messages_update_receiver_read" on public.messages;
create policy "messages_update_receiver_read"
on public.messages
for update
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Triggers: in-app notifications (never fail parent row)
-- ---------------------------------------------------------------------------
create or replace function public.notify_tutor_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text;
  v_booking_notice text;
begin
  select coalesce(nullif(trim(full_name), ''), 'Student') into v_student_name
  from public.users
  where id = new.student_id;

  v_booking_notice :=
    v_student_name
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
  v_sender_name text;
  v_preview text;
  v_notice_body text;
begin
  -- Automated booking opener (see booking-thread-opening-message.sql); tutor already gets booking_request.
  if position('[Platform booking]' in trim(new.content)) = 1 then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), 'Someone') into v_sender_name
  from public.users
  where id = new.sender_id;

  v_preview := left(trim(new.content), 240);
  if length(v_preview) < length(trim(new.content)) then
    v_preview := v_preview || '…';
  end if;

  v_notice_body := v_sender_name || ': ' || v_preview;

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

-- Receivers may only flip is_read (RLS already limits UPDATE to receiver).
create or replace function public.messages_enforce_read_only_fields()
returns trigger
language plpgsql
as $$
begin
  if old.sender_id is distinct from new.sender_id
     or old.receiver_id is distinct from new.receiver_id
     or old.booking_id is distinct from new.booking_id
     or old.content is distinct from new.content
     or old.created_at is distinct from new.created_at
  then
    raise exception 'messages: only is_read may be updated';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_messages_enforce_patch on public.messages;
create trigger trg_messages_enforce_patch
before update on public.messages
for each row
execute function public.messages_enforce_read_only_fields();

-- ---------------------------------------------------------------------------
-- Realtime / postgres_changes（与左侧 Database →「Replication」读副本无关）
-- 请见同目录可选脚本：realtime-publication-messages.sql
-- 或在 Dashboard：Database → Publications → supabase_realtime → 勾选 `messages`
--
-- 预约后自动出现会话首条：见 booking-thread-opening-message.sql（需与本文件中的 notify 跳过逻辑一致）
