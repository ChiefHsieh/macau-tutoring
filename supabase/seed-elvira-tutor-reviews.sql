-- Elvira 导师：插入 1 条五星评价（无文字评论）
-- tutor_profiles.id = 965e7e0b-b969-4cc4-b704-e4f96e70f699
--
-- 在 Supabase Dashboard → SQL Editor 执行（postgres，绕过 RLS）。
-- 会先删除该导师既有 reviews，再插入 1 条五星；trigger 会自动更新 average_rating / total_reviews。

begin;

do $$
declare
  v_tutor_id uuid := '965e7e0b-b969-4cc4-b704-e4f96e70f699';
  v_actual text;
begin
  select tp.display_name into v_actual
  from public.tutor_profiles tp
  where tp.id = v_tutor_id;

  if v_actual is null then
    raise exception '校验失败：tutor_profiles 中不存在 id %。', v_tutor_id;
  end if;

  if trim(v_actual) <> trim('Elvira') then
    raise exception
      using message = format(
        '校验失败：该 UUID 的 display_name 为「%s」，预期「Elvira」。',
        v_actual
      );
  end if;
end $$;

delete from public.reviews
where tutor_id = '965e7e0b-b969-4cc4-b704-e4f96e70f699';

insert into public.reviews (tutor_id, student_id, booking_id, rating, comment, created_at)
values
  ('965e7e0b-b969-4cc4-b704-e4f96e70f699', null, null, 5, null, now() - interval '14 days');

commit;
