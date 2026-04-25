-- Hotfix: fix role helper recursion + allow admin notification inserts
-- Run this whole script once in Supabase SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
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
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'student'
  );
$$;

-- Allow admins to create system notifications for any user.
drop policy if exists "notifications_insert_admin_only" on public.notifications;
create policy "notifications_insert_admin_only"
on public.notifications
for insert
with check (public.is_admin());
