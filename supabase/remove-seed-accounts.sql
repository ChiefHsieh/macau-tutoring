-- Remove seeded/demo tutor accounts and showcase lead cards.
-- Safe to re-run (idempotent).
-- Run the whole file once in Supabase SQL Editor as postgres.

do $$
declare
  seed_ids uuid[];
begin
  select coalesce(array_agg(distinct src.id), '{}'::uuid[])
  into seed_ids
  from (
    select u.id
    from public.users u
    where u.email ilike 'seed-%@macau-tutoring.local'
       or u.email ilike 'seed10-%@macau-tutoring.local'

    union

    select au.id
    from auth.users au
    where au.email ilike 'seed-%@macau-tutoring.local'
       or au.email ilike 'seed10-%@macau-tutoring.local'

    union

    select unnest(
      array[
        'a1111111-1111-4111-8111-111111111111'::uuid,
        'a2222222-2222-4222-8222-222222222222'::uuid,
        'a3333333-3333-4333-8333-333333333333'::uuid,
        'a4444444-4444-4444-8444-444444444444'::uuid,
        'b1111111-1111-4111-8111-111111111111'::uuid,
        'b2222222-2222-4222-8222-222222222222'::uuid,
        'b3333333-3333-4333-8333-333333333333'::uuid,
        'b4444444-4444-4444-8444-444444444444'::uuid,
        'b5555555-5555-4555-8555-555555555555'::uuid,
        'b6666666-6666-4666-8666-666666666666'::uuid,
        'b7777777-7777-4777-8777-777777777777'::uuid,
        'b8888888-8888-4888-8888-888888888888'::uuid,
        'b9999999-9999-4999-8999-999999999999'::uuid,
        'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
      ]
    )
  ) as src;

  -- Remove dependent app rows first.
  delete from public.device_push_tokens
  where user_id = any(seed_ids);

  delete from public.notifications
  where user_id = any(seed_ids)
     or related_id = any(seed_ids);

  delete from public.messages
  where sender_id = any(seed_ids)
     or receiver_id = any(seed_ids);

  delete from public.reviews
  where tutor_id = any(seed_ids)
     or student_id = any(seed_ids);

  delete from public.bookings
  where tutor_id = any(seed_ids)
     or student_id = any(seed_ids);

  delete from public.tutor_availability
  where tutor_id = any(seed_ids);

  delete from public.tutor_availability_one_off
  where tutor_id = any(seed_ids);

  delete from public.tutor_unavailability_blocks
  where tutor_id = any(seed_ids);

  delete from public.tutor_subjects
  where tutor_id = any(seed_ids);

  delete from public.tutor_verification_documents
  where tutor_id = any(seed_ids);

  delete from public.tutor_profiles
  where id = any(seed_ids);

  delete from public.users
  where id = any(seed_ids)
     or email ilike 'seed-%@macau-tutoring.local'
     or email ilike 'seed10-%@macau-tutoring.local';

  -- Remove auth records last.
  delete from auth.identities
  where user_id = any(seed_ids);

  delete from auth.users
  where id = any(seed_ids)
     or email ilike 'seed-%@macau-tutoring.local'
     or email ilike 'seed10-%@macau-tutoring.local';

  -- Remove showcase "recent demands" seed cards.
  delete from public.parent_leads
  where lead_source = 'showcase_202604_cards'
     or notes like 'seed-card-%'
     or phone like 'showcase-%';
end $$;
