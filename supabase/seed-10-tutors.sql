-- Seed 10 tutor profiles for directory cards (idempotent).
-- Run as postgres in Supabase SQL Editor.
-- Shared login password for all seeded tutors: SeedTutor123!

create extension if not exists pgcrypto;

do $$
declare
  v_instance uuid;
  v_pw text := crypt('SeedTutor123!', gen_salt('bf'));
  id1 uuid := 'b1111111-1111-4111-8111-111111111111';
  id2 uuid := 'b2222222-2222-4222-8222-222222222222';
  id3 uuid := 'b3333333-3333-4333-8333-333333333333';
  id4 uuid := 'b4444444-4444-4444-8444-444444444444';
  id5 uuid := 'b5555555-5555-4555-8555-555555555555';
  id6 uuid := 'b6666666-6666-4666-8666-666666666666';
  id7 uuid := 'b7777777-7777-4777-8777-777777777777';
  id8 uuid := 'b8888888-8888-4888-8888-888888888888';
  id9 uuid := 'b9999999-9999-4999-8999-999999999999';
  id10 uuid := 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
begin
  select coalesce(
    (select u.instance_id from auth.users u where u.instance_id is not null limit 1),
    (select i.id from auth.instances i limit 1)
  )
  into v_instance;

  if v_instance is null then
    raise exception 'Cannot resolve auth instance_id. Create one auth user first, then re-run.';
  end if;

  delete from auth.users where id in (id1,id2,id3,id4,id5,id6,id7,id8,id9,id10);

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (id1, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-1@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id2, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-2@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id3, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-3@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id4, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-4@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id5, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-5@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id6, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-6@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id7, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-7@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id8, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-8@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id9, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-9@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (id10, v_instance, 'authenticated', 'authenticated', 'seed10-tutor-10@macau-tutoring.local', v_pw, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), id1, jsonb_build_object('sub', id1::text, 'email', 'seed10-tutor-1@macau-tutoring.local'), 'email', id1::text, now(), now(), now()),
    (gen_random_uuid(), id2, jsonb_build_object('sub', id2::text, 'email', 'seed10-tutor-2@macau-tutoring.local'), 'email', id2::text, now(), now(), now()),
    (gen_random_uuid(), id3, jsonb_build_object('sub', id3::text, 'email', 'seed10-tutor-3@macau-tutoring.local'), 'email', id3::text, now(), now(), now()),
    (gen_random_uuid(), id4, jsonb_build_object('sub', id4::text, 'email', 'seed10-tutor-4@macau-tutoring.local'), 'email', id4::text, now(), now(), now()),
    (gen_random_uuid(), id5, jsonb_build_object('sub', id5::text, 'email', 'seed10-tutor-5@macau-tutoring.local'), 'email', id5::text, now(), now(), now()),
    (gen_random_uuid(), id6, jsonb_build_object('sub', id6::text, 'email', 'seed10-tutor-6@macau-tutoring.local'), 'email', id6::text, now(), now(), now()),
    (gen_random_uuid(), id7, jsonb_build_object('sub', id7::text, 'email', 'seed10-tutor-7@macau-tutoring.local'), 'email', id7::text, now(), now(), now()),
    (gen_random_uuid(), id8, jsonb_build_object('sub', id8::text, 'email', 'seed10-tutor-8@macau-tutoring.local'), 'email', id8::text, now(), now(), now()),
    (gen_random_uuid(), id9, jsonb_build_object('sub', id9::text, 'email', 'seed10-tutor-9@macau-tutoring.local'), 'email', id9::text, now(), now(), now()),
    (gen_random_uuid(), id10, jsonb_build_object('sub', id10::text, 'email', 'seed10-tutor-10@macau-tutoring.local'), 'email', id10::text, now(), now(), now());

  insert into public.users (id, role, full_name, phone, whatsapp, email, is_verified)
  values
    (id1, 'tutor', '陳子瑜', '+85362000001', null, 'seed10-tutor-1@macau-tutoring.local', true),
    (id2, 'tutor', 'Charlotte Leong', '+85362000002', null, 'seed10-tutor-2@macau-tutoring.local', true),
    (id3, 'tutor', '黃浩然', '+85362000003', null, 'seed10-tutor-3@macau-tutoring.local', true),
    (id4, 'tutor', 'Sofia Chan', '+85362000004', null, 'seed10-tutor-4@macau-tutoring.local', true),
    (id5, 'tutor', '李芷晴', '+85362000005', null, 'seed10-tutor-5@macau-tutoring.local', true),
    (id6, 'tutor', 'Jason Fong', '+85362000006', null, 'seed10-tutor-6@macau-tutoring.local', true),
    (id7, 'tutor', '王家怡', '+85362000007', null, 'seed10-tutor-7@macau-tutoring.local', true),
    (id8, 'tutor', 'Miguel Lei', '+85362000008', null, 'seed10-tutor-8@macau-tutoring.local', true),
    (id9, 'tutor', '鄭雅雯', '+85362000009', null, 'seed10-tutor-9@macau-tutoring.local', true),
    (id10, 'tutor', 'Raymond Choi', '+85362000010', null, 'seed10-tutor-10@macau-tutoring.local', true);

  insert into public.tutor_profiles (
    id, display_name, district, exact_location, hourly_rate, working_period_start, working_period_end,
    service_type, education_background, teaching_experience, bio, profile_photo, is_verified, average_rating, total_reviews
  )
  values
    (id1, '陳子瑜', '澳門半島', '|高士德|水坑尾|荷蘭園|東望洋|', 320, date '2026-05-15', date '2026-10-31', 'both',
     '碩士 · 香港科技大學 · 物理學 · 2021-2023\n學士 · 澳門大學 · 應用物理及化學 · 2017-2021',
     '5 years', '主攻高中理科與國際課程，擅長把抽象概念轉化為可視化題型策略。',
     'https://randomuser.me/api/portraits/men/32.jpg', true, 4.8, 9),
    (id2, 'Charlotte Leong', '氹仔', '|氹仔舊城|氹仔花城|氹仔濠景|', 280, date '2026-06-01', date '2026-11-20', 'online',
     '碩士 · 香港大學 · 應用語言學 · 2020-2022\n學士 · 澳門大學 · 英文研究 · 2016-2020',
     '4 years', '以能力分層設計課堂，重點提升閱讀寫作與應試表達。',
     'https://randomuser.me/api/portraits/women/44.jpg', true, 4.6, 7),
    (id3, '黃浩然', '路環', '|黑沙|竹灣|路環市區|', 170, date '2026-05-10', date '2026-09-30', 'in-person',
     '學士 · 澳門大學 · 教育學（數學教育） · 2018-2022',
     '3 years', '擅長建立基礎與學習習慣，適合需要穩步補底的學生。',
     'https://randomuser.me/api/portraits/men/58.jpg', true, 4.2, 5),
    (id4, 'Sofia Chan', '路氹城', '|路氹城（金光大道 / 威尼斯人 / 銀河片區）|', 360, date '2026-05-20', date '2026-10-25', 'both',
     '碩士 · 倫敦政治經濟學院 · 經濟學 · 2020-2021\n學士 · 香港中文大學 · 計量金融 · 2016-2020',
     '6 years', '聚焦商科與數據題型，搭配歷屆題拆解與答題框架訓練。',
     'https://randomuser.me/api/portraits/women/65.jpg', true, 4.9, 10),
    (id5, '李芷晴', '澳門半島', '|南灣|西灣|新馬路|下環|', 150, date '2026-05-12', date '2026-08-31', 'in-person',
     '學士 · 澳門大學 · 中文教育 · 2017-2021',
     '4 years', '重視讀寫能力與學科理解並進，課堂節奏清晰。',
     'https://randomuser.me/api/portraits/women/22.jpg', true, 4.3, 4),
    (id6, 'Jason Fong', '氹仔', '|氹仔北安|氹仔舊城|氹仔花城|', 200, date '2026-06-05', date '2026-11-30', 'online',
     '學士 · 香港理工大學 · 電子及資訊工程 · 2018-2022',
     '3 years', '善於用步驟化講解建立解題流程，幫助學生掌握理工科題目關鍵點。',
     'https://randomuser.me/api/portraits/men/41.jpg', true, 3.9, 3),
    (id7, '王家怡', '路氹城', '|路氹城（金光大道 / 威尼斯人 / 銀河片區）|', 270, date '2026-05-18', date '2026-10-10', 'both',
     '碩士 · 香港城市大學 · 翻譯與語言科技 · 2021-2023\n學士 · 澳門理工大學 · 語言及翻譯 · 2017-2021',
     '5 years', '多語言教學經驗完整，重視輸出能力與考試實戰。',
     'https://randomuser.me/api/portraits/women/31.jpg', true, 4.7, 8),
    (id8, 'Miguel Lei', '路環', '|黑沙|竹灣|路環市區|', 180, date '2026-05-08', date '2026-09-20', 'in-person',
     '學士 · 澳門大學 · 葡英翻譯學 · 2016-2020',
     '4 years', '以跨語言理解與詞彙場景訓練為核心，提升語言實用度與應試穩定性。',
     'https://randomuser.me/api/portraits/men/73.jpg', true, 4.0, 2),
    (id9, '鄭雅雯', '澳門半島', '|水坑尾|南灣|媽閣|西灣|', 300, date '2026-05-25', date '2026-10-31', 'online',
     '碩士 · 香港中文大學 · 生物醫學工程 · 2021-2023\n學士 · 澳門大學 · 生物科學 · 2017-2021',
     '5 years', '偏重概念整合與錯題回溯，搭配分段測驗追蹤進度。',
     'https://randomuser.me/api/portraits/women/52.jpg', true, 5.0, 6),
    (id10, 'Raymond Choi', '氹仔', '|氹仔舊城|氹仔花城|氹仔北安|氹仔濠景|', 260, date '2026-06-10', date '2026-11-15', 'both',
     '學士 · 香港大學 · 數學與經濟學 · 2018-2022',
     '4 years', '擅長跨科整合（理科+商科）與時間管理訓練，提升多科備考效率。',
     'https://randomuser.me/api/portraits/men/29.jpg', true, 4.4, 1);

  insert into public.tutor_subjects (tutor_id, subject, grade_level)
  values
    (id1,'數學','高一'), (id1,'數學','高二'), (id1,'數學','高三'), (id1,'物理','高二'), (id1,'化學','高三'), (id1,'英文','A-Level'),
    (id2,'英文','初中1-3年級'), (id2,'英文','高一'), (id2,'英文','IELTS'), (id2,'中文','初中1-3年級'),
    (id3,'數學','小學1-6年級'), (id3,'數學','初中1-3年級'), (id3,'中文','初中1-3年級'), (id3,'生物','初中1-3年級'),
    (id4,'經濟','高三'), (id4,'商業','IB'), (id4,'數學','A-Level'), (id4,'英文','SAT'),
    (id5,'中文','小學1-6年級'), (id5,'英文','初中1-3年級'), (id5,'歷史','高一'),
    (id6,'物理','高一'), (id6,'數學','高二'), (id6,'資訊及通訊科技','IGCSE'),
    (id7,'英文','IELTS'), (id7,'法文','TOEFL'), (id7,'西班牙文','SAT'),
    (id8,'葡文','小學1-6年級'), (id8,'英文','初中1-3年級'), (id8,'地理','澳門四校聯考'),
    (id9,'生物','高三'), (id9,'化學','IB'), (id9,'數學','A-Level'),
    (id10,'數學','高二'), (id10,'物理','IGCSE'), (id10,'經濟','澳門四校聯考'), (id10,'商業','SAT'), (id10,'英文','高三');
end $$;

