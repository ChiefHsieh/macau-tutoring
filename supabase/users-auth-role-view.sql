-- Admin view: auth email + student/tutor role (run once in Supabase SQL Editor)
-- Table Editor → public → users_auth_role_summary

create or replace view public.users_auth_role_summary as
select
  au.id,
  au.email,
  coalesce(pu.role, au.raw_user_meta_data ->> 'role') as role,
  coalesce(pu.full_name, au.raw_user_meta_data ->> 'full_name') as full_name,
  pu.phone,
  au.created_at as auth_created_at,
  pu.created_at as profile_created_at,
  case
    when pu.id is null then 'missing_public_profile'
    when pu.role is null then 'missing_role'
    else 'ok'
  end as profile_status
from auth.users au
left join public.users pu on pu.id = au.id;

comment on view public.users_auth_role_summary is
  'Join auth.users with public.users; role prefers public.users, falls back to auth user_metadata.';

-- Keep off the public API; use SQL Editor / Table Editor / service role only.
revoke all on public.users_auth_role_summary from anon, authenticated;
grant select on public.users_auth_role_summary to service_role;

-- ---------------------------------------------------------------------------
-- Optional one-time backfill: copy existing public.users → auth user_metadata
-- (Uncomment and run if you already have users before metadata sync shipped.)
-- ---------------------------------------------------------------------------
-- update auth.users au
-- set
--   raw_user_meta_data = coalesce(au.raw_user_meta_data, '{}'::jsonb)
--     || jsonb_build_object('role', pu.role, 'full_name', pu.full_name),
--   updated_at = now()
-- from public.users pu
-- where pu.id = au.id
--   and pu.role in ('student', 'tutor');
