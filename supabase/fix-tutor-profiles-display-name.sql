-- Fix missing column: tutor_profiles.display_name
-- Run this in Supabase SQL Editor for projects created from an older schema.

alter table public.tutor_profiles
add column if not exists display_name text;

-- Backfill from users.full_name where possible
update public.tutor_profiles tp
set display_name = u.full_name
from public.users u
where tp.id = u.id
  and (tp.display_name is null or btrim(tp.display_name) = '');

-- Ensure non-null after backfill
update public.tutor_profiles
set display_name = 'Tutor'
where display_name is null or btrim(display_name) = '';

alter table public.tutor_profiles
alter column display_name set not null;
