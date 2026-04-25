-- 允许 public.users 表中多条记录使用相同手机号（去掉唯一约束）。
-- 在 Supabase SQL Editor 对「已有库」执行一次即可。
-- 约束名默认为 users_phone_key；若报错，在 Table Editor → users → Constraints 查看实际名称后替换。

alter table public.users drop constraint if exists users_phone_key;

-- 若曾以「唯一索引」形式创建（少见），可再执行：
-- drop index if exists public.users_phone_key;
