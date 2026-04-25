-- 在 Supabase → SQL Editor 运行，确认「最近需求」数据源正常。
-- 若第 1 步报错「column … does not exist」，请先执行 parent-leads-extend.sql。

-- 1) 公开 feed 行数（>0 时首页应显示真实卡片、隐藏示例黄条）
select count(*) as public_feed_rows
from public.parent_lead_public_feed;

-- 2) 最近 5 条（应无电话/微信列）
select lead_id, child_grade, subject, district, budget_max, created_at
from public.parent_lead_public_feed
order by created_at desc
limit 5;

-- 3) 与原始留资数量对比（feed 应 ≤ parent_leads；新库应相等）
select
  (select count(*) from public.parent_leads) as parent_leads_rows,
  (select count(*) from public.parent_lead_public_feed) as public_feed_rows;

-- 4) 触发器是否存在且已启用（新留资应自动写入 feed）
-- tgenabled 含义（易与数字 0 混淆）：O = 已启用(ORIGIN)；D = 已关闭；R/A 为复制/始终模式。
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.parent_leads'::regclass
  and tgname = 'parent_leads_mirror_public_feed';
