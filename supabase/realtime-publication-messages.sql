-- Optional: enable Realtime (postgres_changes) for private chat.
-- This is NOT the "Replication" page (read replicas). Use Publications or this SQL.
--
-- Dashboard: Database → Publications → supabase_realtime → enable table `messages`
-- Docs: https://supabase.com/docs/guides/realtime/postgres-changes
--
-- Run once in SQL Editor. If you see "already member of publication", the table is already enabled — safe to ignore.

alter publication supabase_realtime add table public.messages;

-- Optional: live-update notification bell without refresh (usually unnecessary).
-- alter publication supabase_realtime add table public.notifications;
