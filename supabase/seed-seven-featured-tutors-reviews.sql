-- 7 位首页/精选导师：各插入 1 条五星评价（无文字评论）
-- Kelvin Ao · Laver · Sunny Hsieh · 張洛怡 · 詠瑩 · 逄嘉濠 · 陳嘉怡
--
-- 在 Supabase Dashboard → SQL Editor 以默认角色执行（postgres，会绕过 RLS）。
-- 会先删除下列导师在 public.reviews 中的既有记录，再插入新评价；
-- 若已部署 reviews 相关 trigger，average_rating / total_reviews 会自动重算。

begin;

do $$
declare
  row_data record;
  v_actual text;
begin
  for row_data in
    select * from (
      values
        ('c50da3b5-ec1c-427e-a7ec-5fef484a9099'::uuid, 'Kelvin Ao'),
        ('775cf7b5-1581-4006-b491-0970737290ab'::uuid, 'Laver'),
        ('0329e8aa-ad7c-44cb-990b-0c4682239293'::uuid, 'Sunny Hsieh'),
        ('1fc18695-17e8-459f-aa9f-6997b5a52b76'::uuid, '張洛怡'),
        ('9ebeeb79-cddf-412e-9b7a-377310b533a3'::uuid, '詠瑩'),
        ('75820df2-7266-41d6-ac15-377abf36980d'::uuid, '逄嘉濠'),
        ('25107067-93af-4a7a-bc48-86ed31da333c'::uuid, '陳嘉怡')
    ) as t(id, expected_name)
  loop
    select tp.display_name into v_actual
    from public.tutor_profiles tp
    where tp.id = row_data.id;

    if v_actual is null then
      raise exception '校验失败：tutor_profiles 中不存在 id %。', row_data.id;
    end if;

    if trim(v_actual) <> trim(row_data.expected_name) then
      raise exception
        using message = format(
          '校验失败：id % 的 display_name 为「%s」，预期「%s」。',
          row_data.id, v_actual, row_data.expected_name
        );
    end if;
  end loop;
end $$;

delete from public.reviews
where tutor_id in (
  'c50da3b5-ec1c-427e-a7ec-5fef484a9099',
  '775cf7b5-1581-4006-b491-0970737290ab',
  '0329e8aa-ad7c-44cb-990b-0c4682239293',
  '1fc18695-17e8-459f-aa9f-6997b5a52b76',
  '9ebeeb79-cddf-412e-9b7a-377310b533a3',
  '75820df2-7266-41d6-ac15-377abf36980d',
  '25107067-93af-4a7a-bc48-86ed31da333c'
);

insert into public.reviews (tutor_id, student_id, booking_id, rating, comment, created_at)
values
  ('c50da3b5-ec1c-427e-a7ec-5fef484a9099', null, null, 5, null, now() - interval '30 days'),
  ('775cf7b5-1581-4006-b491-0970737290ab', null, null, 5, null, now() - interval '30 days'),
  ('0329e8aa-ad7c-44cb-990b-0c4682239293', null, null, 5, null, now() - interval '30 days'),
  ('1fc18695-17e8-459f-aa9f-6997b5a52b76', null, null, 5, null, now() - interval '30 days'),
  ('9ebeeb79-cddf-412e-9b7a-377310b533a3', null, null, 5, null, now() - interval '30 days'),
  ('75820df2-7266-41d6-ac15-377abf36980d', null, null, 5, null, now() - interval '30 days'),
  ('25107067-93af-4a7a-bc48-86ed31da333c', null, null, 5, null, now() - interval '30 days');

-- 若线上未部署 rating trigger，可取消下行注释手动重算：
-- select public.refresh_tutor_rating_stats(id) from public.tutor_profiles
-- where id in (
--   'c50da3b5-ec1c-427e-a7ec-5fef484a9099',
--   '775cf7b5-1581-4006-b491-0970737290ab',
--   '0329e8aa-ad7c-44cb-990b-0c4682239293',
--   '1fc18695-17e8-459f-aa9f-6997b5a52b76',
--   '9ebeeb79-cddf-412e-9b7a-377310b533a3',
--   '75820df2-7266-41d6-ac15-377abf36980d',
--   '25107067-93af-4a7a-bc48-86ed31da333c'
-- );

commit;
