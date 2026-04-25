-- Tutor verification PDFs — Storage policies for bucket `tutor-verification`
--
-- 若你已在 Dashboard 创建同名 PUBLIC 桶，请直接打开并执行：
--   supabase/storage-tutor-verification-policies-only.sql
-- （整文件复制到 SQL Editor 即可，无需从本文件手动截取。）
--
-- 上传失败常见原因：storage.objects 上没有任何 policy → authenticated 用户无法 INSERT。

-- ── 可选：仅用 SQL 建桶（若已在 UI 建桶可跳过整段） ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('tutor-verification', 'tutor-verification', true)
on conflict (id) do nothing;

-- ── 策略（必做：否则无法上传）────────────────────────────────────────────────

drop policy if exists "Tutors can upload own verification PDFs" on storage.objects;
create policy "Tutors can upload own verification PDFs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'tutor-verification'
  and (name like auth.uid()::text || '/%')
);

drop policy if exists "Anyone can read tutor verification PDFs" on storage.objects;
create policy "Anyone can read tutor verification PDFs"
on storage.objects for select
to public
using (bucket_id = 'tutor-verification');

drop policy if exists "Tutors can update own verification PDFs" on storage.objects;
create policy "Tutors can update own verification PDFs"
on storage.objects for update
to authenticated
using (
  bucket_id = 'tutor-verification'
  and (name like auth.uid()::text || '/%')
);

drop policy if exists "Tutors can delete own verification PDFs" on storage.objects;
create policy "Tutors can delete own verification PDFs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'tutor-verification'
  and (name like auth.uid()::text || '/%')
);
