-- Run on existing Supabase projects after schema drift.
-- Adds homepage quick-form fields and lead attribution.

alter table public.parent_leads
  add column if not exists lead_source text default 'unknown',
  add column if not exists district text,
  add column if not exists budget_max integer;

comment on column public.parent_leads.lead_source is 'Attribution e.g. homepage_quick_form';
