"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/app/[locale]/messages/actions";
import { useTranslations } from "next-intl";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ThreadMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

type MessageThreadClientProps = {
  locale: string;
  peerId: string;
  initialMessages: ThreadMessage[];
  labels: {
    placeholder: string;
    send: string;
  };
};

export function MessageThreadClient({
  locale,
  peerId,
  initialMessages,
  labels,
}: MessageThreadClientProps) {
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [rows, setRows] = useState<ThreadMessage[]>(initialMessages);
  const [me, setMe] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [rows],
  );

  useEffect(() => {
    setRows(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      setMe(user.id);

      channel = supabase
        .channel(`messages:${user.id}:${peerId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const row = payload.new as ThreadMessage;
            const inThread =
              (row.sender_id === user.id && row.receiver_id === peerId) ||
              (row.sender_id === peerId && row.receiver_id === user.id);
            if (!inThread) return;
            setRows((prev) => {
              if (prev.some((p) => p.id === row.id)) return prev;
              return [...prev, row];
            });
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [peerId]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-[#1A2456] bg-[#0A0F35] p-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">{labels.placeholder}</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((m) => {
              const mine = me && m.sender_id === me;
              return (
                <li
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "border border-[#E6C699]/30 bg-[#101742] text-white"
                        : "border border-[#1A2456] bg-[#0D143D] text-[#E2E8F0]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-[#94A3B8]"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        className="grid gap-2"
        action={async (formData) => {
          const res = await sendMessageAction(formData);
          if (res.error) {
            window.alert(res.error);
            return;
          }
          router.refresh();
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="receiver_id" value={peerId} />
        <Textarea name="content" required minLength={1} maxLength={4000} rows={3} placeholder={labels.placeholder} />
        <SubmitButton type="submit" pendingLabel={tCommon("loading")}>
          {labels.send}
        </SubmitButton>
      </form>
    </div>
  );
}
