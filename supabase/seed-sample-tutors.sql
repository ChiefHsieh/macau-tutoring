-- Sample tutors for student directory / booking smoke tests.
-- Run in Supabase SQL Editor as postgres (Dashboard) or via `supabase db execute` with sufficient privileges.
--
-- Login (email / password) after seeding — all seed tutors share the same password:
--   Password: SeedTutor123!
--
-- Idempotent: removes previous seed rows by fixed UUIDs, then re-inserts.

create extension if not exists pgcrypto;

do $$
declare
  v_instance uuid;
  v_pw text := crypt('SeedTutor123!', gen_salt('bf'));
  -- Fixed UUIDs (valid v4) for repeatable cleanup
  id1 uuid := 'a1111111-1111-4111-8111-111111111111';
  id2 uuid := 'a2222222-2222-4222-8222-222222222222';
  id3 uuid := 'a3333333-3333-4333-8333-333333333333';
  id4 uuid := 'a4444444-4444-4444-8444-444444444444';
begin
  -- Cloud projects often expose no rows in auth.instances; every auth.users row carries the same instance_id.
  select coalesce(
    (select u.instance_id from auth.users u where u.instance_id is not null limit 1),
    (select i.id from auth.instances i limit 1)
  )
  into v_instance;

  if v_instance is null then
    raise exception
      'Cannot resolve auth instance_id (no rows in auth.users and auth.instances). '
      'In Dashboard: Authentication → Users → Add user (any email/password), save, then run this script again.';
  end if;

  delete from auth.users where id in (id1, id2, id3, id4);

  -- 1) Auth + identities
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      id1,
      v_instance,
      'authenticated',
      'authenticated',
      'seed-tutor-1@macau-tutoring.local',
      v_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      id2,
      v_instance,
      'authenticated',
      'authenticated',
      'seed-tutor-2@macau-tutoring.local',
      v_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      id3,
      v_instance,
      'authenticated',
      'authenticated',
      'seed-tutor-3@macau-tutoring.local',
      v_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      id4,
      v_instance,
      'authenticated',
      'authenticated',
      'seed-tutor-4@macau-tutoring.local',
      v_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), id1, jsonb_build_object('sub', id1::text, 'email', 'seed-tutor-1@macau-tutoring.local'), 'email', id1::text, now(), now(), now()),
    (gen_random_uuid(), id2, jsonb_build_object('sub', id2::text, 'email', 'seed-tutor-2@macau-tutoring.local'), 'email', id2::text, now(), now(), now()),
    (gen_random_uuid(), id3, jsonb_build_object('sub', id3::text, 'email', 'seed-tutor-3@macau-tutoring.local'), 'email', id3::text, now(), now(), now()),
    (gen_random_uuid(), id4, jsonb_build_object('sub', id4::text, 'email', 'seed-tutor-4@macau-tutoring.local'), 'email', id4::text, now(), now(), now());

  -- 2) App users (tutor role)
  insert into public.users (id, role, full_name, phone, whatsapp, email, is_verified)
  values
    (id1, 'tutor', '陳敏儀', '+85361234001', null, 'seed-tutor-1@macau-tutoring.local', true),
    (id2, 'tutor', 'James Wong', '+85361234002', null, 'seed-tutor-2@macau-tutoring.local', false),
    (id3, 'tutor', '李偉明', '+85361234003', null, 'seed-tutor-3@macau-tutoring.local', true),
    (id4, 'tutor', 'Sofia Almeida', '+85361234004', null, 'seed-tutor-4@macau-tutoring.local', false);

  -- 3) Tutor profiles
  insert into public.tutor_profiles (
    id,
    display_name,
    district,
    exact_location,
    hourly_rate,
    working_period_start,
    working_period_end,
    service_type,
    education_background,
    teaching_experience,
    bio,
    profile_photo,
    is_verified,
    average_rating,
    total_reviews
  )
  values
    (
      id1,
      '陳敏儀',
      'Taipa',
      '氹仔花城公園一帶',
      150,
      date '2025-01-01',
      date '2026-12-31',
      'online',
      'BA · HKU · Chinese Language and Literature · 2018-2022',
      '4 年中小學補習經驗，專攻普話與閱寫。',
      '線上為主，可配合家長時間。',
      null,
      true,
      4.80,
      16
    ),
    (
      id2,
      'James Wong',
      'Coloane',
      '路環市區步行 10 分鐘內',
      180,
      date '2025-01-01',
      date '2026-12-31',
      'both',
      'BSc · CUHK · Mathematics · 2019-2023',
      '中小學數學與奧數啟蒙。',
      '可上門或線上，週末檔期較多。',
      null,
      false,
      0.00,
      0
    ),
    (
      id3,
      '李偉明',
      'Macau Peninsula',
      '新口岸區',
      320,
      date '2025-01-01',
      date '2026-12-31',
      'in-person',
      'MPhil · HKUST · Physics · 2016-2020',
      'DSE 物理與理科補習 6 年。',
      '只接本島面授，偏重考試技巧與題型拆解。',
      null,
      true,
      4.92,
      27
    ),
    (
      id4,
      'Sofia Almeida',
      'Macau Peninsula',
      '南灣區',
      220,
      date '2025-01-01',
      date '2026-12-31',
      'online',
      'BA · Universidade de Lisboa · Modern Languages · 2015-2019',
      'IB / 英語文學與葡語會話。',
      '雙語授課，適合國際學校學生。',
      null,
      false,
      4.10,
      5
    );

  -- 4) Subjects (grade_level must match app enum for directory filters)
  insert into public.tutor_subjects (tutor_id, subject, grade_level)
  values
    (id1, 'Chinese', 'Primary 1-6'),
    (id1, 'Chinese', 'Form 1-3'),
    (id1, 'Putonghua', 'Primary 1-6'),
    (id2, 'Mathematics', 'Primary 1-6'),
    (id2, 'Mathematics', 'Form 1-3'),
    (id2, 'Mathematics', 'IGCSE'),
    (id3, 'Physics', 'DSE'),
    (id3, 'Physics', 'Form 4-6'),
    (id4, 'English', 'IB'),
    (id4, 'Portuguese', 'IB'),
    (id4, 'English', 'IGCSE');

  -- 5) Optional weekly availability (helps booking UI)
  insert into public.tutor_availability (tutor_id, day_of_week, start_time, end_time)
  values
    (id1, 1, time '10:00', time '12:00'),
    (id1, 3, time '14:00', time '16:00'),
    (id3, 6, time '09:00', time '12:00'),
    (id3, 6, time '14:00', time '18:00');
end $$;
