# new-message-alert (Edge Function — optional)

Use a Database Webhook on `public.messages` **INSERT** to email the **receiver** when offline. In-app alerts are already created by the SQL trigger `notify_receiver_on_message()` in `notifications-messages.sql`.

Configure the same email provider secrets as `new-booking-alert`.
