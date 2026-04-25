# new-booking-alert (Edge Function)

**Goal:** respond to `bookings` INSERT (via Database Webhook or manual invoke) and send **email** to the tutor. In-app notifications are already handled by the SQL trigger `notify_tutor_on_booking()` in `notifications-messages.sql`.

## Setup

1. Install Supabase CLI and link the project.
2. Set secrets (example providers):
   - `RESEND_API_KEY` or `SENDGRID_API_KEY`
   - `APP_ORIGIN` (e.g. `https://your-app.vercel.app`) for links in the email body
3. Implement `index.ts` to:
   - Parse webhook payload (`record` = new booking row).
   - Load tutor email from `auth.users` or `public.users` using the **service role** client.
   - Send transactional email (bilingual template: zh-HK + en).
4. Deploy: `supabase functions deploy new-booking-alert`
5. In Supabase Dashboard → **Database → Webhooks**: add webhook on `bookings` **INSERT** pointing to this function URL, or use **Cron** / queue if you prefer.

## Notes

- Do **not** expose the service role key to the browser; only use it inside Edge Functions or trusted servers.
- Supabase Auth’s built-in emails only cover auth flows (signup, reset). Custom booking emails need Resend/SendGrid/etc.
