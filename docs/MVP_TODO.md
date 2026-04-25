# Macau Tutoring Marketplace - Execution TODO

## 1) Immediate setup (this week)
- [ ] Create Supabase project and save URL/Anon key.
- [ ] Create Vercel project and connect this repository.
- [ ] Start Macau Pay + Alipay HK merchant applications.
- [ ] Fill `.env.local` from `.env.example`.
- [ ] Run local app with `npm run dev`.

## 2) Database (Week 1)
- [ ] Paste `supabase/schema.sql` into Supabase SQL editor.
- [ ] Enable Row Level Security (RLS) on all business tables.
- [ ] Create role-based policies for tutor/student/admin.
- [ ] Insert seed data for 3 tutors, 3 students.
- [ ] Verify indexes for search and booking performance.

## 3) Auth and onboarding (Weeks 2-3)
- [ ] Email/password sign-up and login.
- [ ] Phone OTP sign-in for Macau users.
- [ ] Role selector after sign-up.
- [ ] Tutor onboarding flow entry.
- [ ] Parent/student onboarding flow entry.

## 4) Tutor profile and availability (Weeks 4-5)
- [ ] Multi-step tutor profile form.
- [ ] Validation rules (rate >= 100, period >= 1 month, subject required).
- [ ] Document upload for verification.
- [ ] Availability management with FullCalendar.
- [ ] Tutor public profile page.

## 5) Student search (Week 6)
- [ ] Search/filter API and UI.
- [ ] Sorting options.
- [ ] Tutor card list view.
- [ ] Up to 3 tutors side-by-side comparison.

## 6) Booking + anti-leakage + payment (Weeks 7-9)
- [ ] Contact redaction before paid booking.
- [ ] Booking checkout flow.
- [ ] Escrow payment status lifecycle.
- [ ] Cancellation and refund policy logic.
- [ ] Weekly payout generation and dispute handling.

## 7) Trust, launch, and monetization (Weeks 10-12+)
- [ ] Review system for completed sessions only.
- [ ] Tutor ranking score.
- [ ] Landing page and beta recruitment flow.
- [ ] Soft launch runbook and monitoring checklist.
- [ ] Commission + subscription rollout plan.
