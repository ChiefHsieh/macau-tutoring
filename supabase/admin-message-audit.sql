-- Audit log for admin-initiated support messages (run in Supabase SQL Editor).
-- Optional: enables Phase 4 logging from sendMessageAction when sender role is admin.

create table if not exists public.admin_message_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users (id) on delete cascade,
  tutor_id uuid not null references public.users (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  content_preview text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_message_audit_admin_created_idx
  on public.admin_message_audit (admin_id, created_at desc);

create index if not exists admin_message_audit_tutor_created_idx
  on public.admin_message_audit (tutor_id, created_at desc);

alter table public.admin_message_audit enable row level security;

drop policy if exists "admin_message_audit_select_admin" on public.admin_message_audit;
create policy "admin_message_audit_select_admin"
on public.admin_message_audit
for select
using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

drop policy if exists "admin_message_audit_insert_self" on public.admin_message_audit;
create policy "admin_message_audit_insert_self"
on public.admin_message_audit
for insert
with check (
  admin_id = auth.uid()
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);
