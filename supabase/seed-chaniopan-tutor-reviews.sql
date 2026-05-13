-- Alex Chan（chaniopan@gmail.com）导师公开评价（2 条五星）
-- tutor_profiles.id = auth user id
--
-- 在 Supabase Dashboard → SQL Editor 以默认角色执行（postgres，会绕过 RLS）。
-- 会先删除该导师在 public.reviews 中的既有记录，再插入下列 2 条；
-- 若已部署 reviews 相关 trigger，average_rating / total_reviews 会自动重算，
-- 且可能向导师插入 2 条「新评价」通知（属预期副作用）。

begin;

do $$
declare
  v_tutor_id uuid := '26f5ac21-f29e-4d94-9717-b7f28456a8dd';
  v_email text;
begin
  select u.email into strict v_email
  from public.users u
  where u.id = v_tutor_id;

  if lower(trim(v_email)) <> lower(trim('chaniopan@gmail.com')) then
    raise exception
      using message = format('校验失败：该 UUID 对应邮箱为 %s，与 chaniopan@gmail.com 不符。', v_email);
  end if;

  if not exists (select 1 from public.tutor_profiles tp where tp.id = v_tutor_id) then
    raise exception '校验失败：tutor_profiles 中不存在该 id。';
  end if;
end $$;

delete from public.reviews
where tutor_id = '26f5ac21-f29e-4d94-9717-b7f28456a8dd';

insert into public.reviews (tutor_id, student_id, booking_id, rating, comment, created_at)
values
  (
    '26f5ac21-f29e-4d94-9717-b7f28456a8dd',
    null,
    null,
    5,
    '真係估唔到線上補習可以咁好，因為Alex好有線上授課經驗，佢係倫敦國王學院嘅博士生，講解化學物理嘅概念超級深入',
    now() - interval '30 days'
  ),
  (
    '26f5ac21-f29e-4d94-9717-b7f28456a8dd',
    null,
    null,
    5,
    'Alex is not just a tutor, he''s a mentor. Highly recommended.',
    now() - interval '10 days'
  );

commit;
