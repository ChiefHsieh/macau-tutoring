-- 仅 Storage 策略（桶 tutor-verification 已在 Dashboard 创建时使用）
-- 用法：Supabase → SQL Editor → 新建查询 → 全选本文件 → Run

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
