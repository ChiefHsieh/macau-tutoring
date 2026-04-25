-- Public, anonymized mirror of parent_leads for the landing page "recent demand" strip.
-- Phone / wechat / notes never appear here. Rows are created by trigger (security definer).

create table if not exists public.parent_lead_public_feed (
  lead_id uuid primary key references public.parent_leads (id) on delete cascade,
  child_grade text not null,
  subject text not null,
  district text,
  budget_max integer,
  created_at timestamptz not null default now()
);

create index if not exists parent_lead_public_feed_created_at_idx
  on public.parent_lead_public_feed (created_at desc);

alter table public.parent_lead_public_feed enable row level security;

drop policy if exists "parent_lead_public_feed_select_public" on public.parent_lead_public_feed;
create policy "parent_lead_public_feed_select_public"
on public.parent_lead_public_feed
for select
using (true);

-- No insert/update/delete for anon — only trigger (definer) writes.

grant select on public.parent_lead_public_feed to anon, authenticated;

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

-- One-time backfill (safe to re-run)
insert into public.parent_lead_public_feed (
  lead_id,
  child_grade,
  subject,
  district,
  budget_max,
  created_at
)
select
  pl.id,
  pl.child_grade,
  pl.subject,
  pl.district,
  pl.budget_max,
  coalesce(pl.created_at, now())
from public.parent_leads pl
on conflict (lead_id) do update set
  child_grade = excluded.child_grade,
  subject = excluded.subject,
  district = excluded.district,
  budget_max = excluded.budget_max,
  created_at = excluded.created_at;
