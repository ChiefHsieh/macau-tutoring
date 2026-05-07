-- Device push tokens for Android/iOS app notifications.
create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform text not null check (platform in ('android', 'ios', 'web')),
  push_token text not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, push_token)
);

create index if not exists idx_device_push_tokens_user_id
  on public.device_push_tokens(user_id);

create index if not exists idx_device_push_tokens_push_token
  on public.device_push_tokens(push_token);

create or replace function public.touch_device_push_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_device_push_tokens_updated_at on public.device_push_tokens;
create trigger trg_touch_device_push_tokens_updated_at
before update on public.device_push_tokens
for each row execute function public.touch_device_push_tokens_updated_at();

alter table public.device_push_tokens enable row level security;

drop policy if exists "device_tokens_owner_read" on public.device_push_tokens;
create policy "device_tokens_owner_read"
on public.device_push_tokens
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "device_tokens_owner_insert" on public.device_push_tokens;
create policy "device_tokens_owner_insert"
on public.device_push_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "device_tokens_owner_update" on public.device_push_tokens;
create policy "device_tokens_owner_update"
on public.device_push_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "device_tokens_owner_delete" on public.device_push_tokens;
create policy "device_tokens_owner_delete"
on public.device_push_tokens
for delete
to authenticated
using (auth.uid() = user_id);
