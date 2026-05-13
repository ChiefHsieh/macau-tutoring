-- Chief Hsieh 导师公开评价（2 条五星）
-- 导师：chiefhsiehtw@gmail.com · tutor_profiles.id = auth user id
--
-- 在 Supabase Dashboard → SQL Editor 以默认角色执行（postgres，会绕过 RLS）。
-- 会先删除该导师在 public.reviews 中的既有记录，再插入下列 2 条；
-- 若已部署 reviews 相关 trigger，average_rating / total_reviews 会自动重算，
-- 且可能向导师插入 2 条「新评价」通知（属预期副作用）。

begin;

do $$
declare
  v_tutor_id uuid := '21cffccc-6d91-4696-b566-f82d95b65da0';
  v_email text;
begin
  select u.email into strict v_email
  from public.users u
  where u.id = v_tutor_id;

  if lower(trim(v_email)) <> lower(trim('chiefhsiehtw@gmail.com')) then
    raise exception
      using message = format('校验失败：该 UUID 对应邮箱为 %s，与 chiefhsiehtw@gmail.com 不符。', v_email);
  end if;

  if not exists (select 1 from public.tutor_profiles tp where tp.id = v_tutor_id) then
    raise exception '校验失败：tutor_profiles 中不存在该 id。';
  end if;
end $$;

delete from public.reviews
where tutor_id = '21cffccc-6d91-4696-b566-f82d95b65da0';

insert into public.reviews (tutor_id, student_id, booking_id, rating, comment, created_at)
values
  (
    '21cffccc-6d91-4696-b566-f82d95b65da0',
    null,
    null,
    5,
    'Absolutely life-changing tutor. His problem-solving approach is something that I value and still using it in my daily life. Worth every penny.',
    now() - interval '30 days'
  ),
  (
    '21cffccc-6d91-4696-b566-f82d95b65da0',
    null,
    null,
    5,
    '身為家長真係冇揀錯 Chief ！佢嘅升學申請服務，Personal statement tips每個細節都執到足。',
    now() - interval '10 days'
  );

commit;
