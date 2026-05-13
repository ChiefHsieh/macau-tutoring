-- Brian Wong 导师公开评价（7 条五星）
-- 导师：wongbrian0803@gmail.com · tutor_profiles.id = auth user id
--
-- 在 Supabase Dashboard → SQL Editor 以默认角色执行（postgres，会绕过 RLS）。
-- 会先删除该导师在 public.reviews 中的既有记录，再插入下列 7 条；
-- 若已部署 reviews 相关 trigger，average_rating / total_reviews 会自动重算，
-- 且可能向导师插入 7 条「新评价」通知（属预期副作用）。

begin;

do $$
declare
  v_tutor_id uuid := '8e9f2a88-c6cf-4b42-9981-27c559bd85b1';
  v_email text;
begin
  select u.email into strict v_email
  from public.users u
  where u.id = v_tutor_id;

  if lower(trim(v_email)) <> lower(trim('wongbrian0803@gmail.com')) then
    raise exception
      using message = format('校验失败：该 UUID 对应邮箱为 %s，与 wongbrian0803@gmail.com 不符。', v_email);
  end if;

  if not exists (select 1 from public.tutor_profiles tp where tp.id = v_tutor_id) then
    raise exception '校验失败：tutor_profiles 中不存在该 id。';
  end if;
end $$;

delete from public.reviews
where tutor_id = '8e9f2a88-c6cf-4b42-9981-27c559bd85b1';

insert into public.reviews (tutor_id, student_id, booking_id, rating, comment, created_at)
values
  (
    '8e9f2a88-c6cf-4b42-9981-27c559bd85b1',
    null,
    null,
    5,
    'Brian Sir有耐性，會將好複雜嘅概念拆到好簡單，仲會針對佢嘅弱點專門出練習。大力推薦俾所有要補理科嘅同學👍',
    now() - interval '70 days'
  ),
  (
    '8e9f2a88-c6cf-4b42-9981-27c559bd85b1',
    null,
    null,
    5,
    '老師教中文同歷史幾好，本來我最憎背書，覺得歷史悶到死，但係老師會用好多故事嚟講解，我睇一次就記得晒',
    now() - interval '60 days'
  ),
  (
    '8e9f2a88-c6cf-4b42-9981-27c559bd85b1',
    null,
    null,
    5,
    'Brian makes topics easy to understand.',
    now() - interval '50 days'
  ),
  (
    '8e9f2a88-c6cf-4b42-9981-27c559bd85b1',
    null,
    null,
    5,
    '老師有愛心，對小朋友超有耐性',
    now() - interval '40 days'
  ),
  (
    '8e9f2a88-c6cf-4b42-9981-27c559bd85b1',
    null,
    null,
    5,
    'Good!',
    now() - interval '30 days'
  ),
  (
    '8e9f2a88-c6cf-4b42-9981-27c559bd85b1',
    null,
    null,
    5,
    '負責任，仲會關心個女嘅學習狀態同心理狀況，幫佢制定適合嘅學習計劃',
    now() - interval '20 days'
  ),
  (
    '8e9f2a88-c6cf-4b42-9981-27c559bd85b1',
    null,
    null,
    5,
    '教得不錯推薦',
    now() - interval '10 days'
  );

commit;
