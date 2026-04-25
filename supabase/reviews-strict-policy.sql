-- Tighten review insert policy:
-- only the student of that exact accepted booking can review that tutor.

alter table public.reviews enable row level security;

drop policy if exists "reviews_insert_student_self" on public.reviews;
create policy "reviews_insert_student_booking_owner_accepted"
on public.reviews
for insert
with check (
  student_id = auth.uid()
  and public.is_student()
  and exists (
    select 1
    from public.bookings b
    where b.id = reviews.booking_id
      and b.student_id = auth.uid()
      and b.tutor_id = reviews.tutor_id
      and b.tutor_decision = 'accepted'
  )
);
