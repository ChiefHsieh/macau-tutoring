"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  canUseWebPushOnThisDevice,
  needsIosHomeScreenInstall,
  subscribeToWebPush,
  syncWebPushIfGranted,
} from "@/lib/pwa-web-push";
import { isCapacitorNative } from "@/lib/pwa-detect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PushUiState =
  | "loading"
  | "install_first"
  | "enable"
  | "denied"
  | "enabled"
  | "unsupported"
  | "session_pending";

type PwaNotificationSettingsProps = {
  /** Set on server when the page already verified login — avoids hiding when client auth is slow. */
  authenticated?: boolean;
};

export function PwaNotificationSettings({ authenticated = false }: PwaNotificationSettingsProps) {
  const t = useTranslations("Pwa");
  const locale = useLocale();
  const [state, setState] = useState<PushUiState>(authenticated ? "loading" : "loading");
  const [busy, setBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [hideNative, setHideNative] = useState(false);

  const refresh = useCallback(async () => {
    if (isCapacitorNative()) {
      setHideNative(true);
      return;
    }
    setHideNative(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (authenticated) {
        setState("session_pending");
      } else {
        setHideNative(true);
      }
      return;
    }

    if (needsIosHomeScreenInstall()) {
      setState("install_first");
      return;
    }

    if (!canUseWebPushOnThisDevice() && typeof Notification !== "undefined") {
      const perm = Notification.permission;
      if (perm === "granted") {
        setState("enabled");
        return;
      }
    }

    if (!("Notification" in window) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    if (!canUseWebPushOnThisDevice()) {
      setState("unsupported");
      return;
    }

    const perm = Notification.permission;
    if (perm === "granted") {
      setState("enabled");
      return;
    }
    if (perm === "denied") {
      setState("denied");
      return;
    }
    setState("enable");
  }, [authenticated]);

  useEffect(() => {
    void refresh();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  const onEnable = async () => {
    setBusy(true);
    setTestMsg(null);
    try {
      const result = await subscribeToWebPush({ requestPermission: true });
      if (result.ok) {
        setState("enabled");
        setTestMsg(t("enableSuccess"));
      } else if (result.reason === "permission_denied") {
        setState("denied");
        setTestMsg(t("permissionDeniedHint"));
      } else if (result.reason === "not_standalone") {
        setState("install_first");
        setTestMsg(t("installFirstHint"));
      } else if (result.reason === "not_logged_in") {
        setState("session_pending");
        setTestMsg(t("sessionPendingHint"));
      } else {
        setTestMsg(result.message ?? t("enableFailed"));
      }
    } finally {
      setBusy(false);
    }
  };

  const onSelfTest = async () => {
    setBusy(true);
    setTestMsg(null);
    try {
      await syncWebPushIfGranted();
      const res = await fetch("/api/push/self-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        reason?: string;
        tokenCount?: number;
      } | null;
      if (data?.ok) {
        setTestMsg(t("testSuccess"));
      } else {
        setTestMsg(data?.reason ?? t("testFailed"));
      }
    } catch {
      setTestMsg(t("testFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (hideNative) return null;

  const showEnableButton =
    state === "enable" ||
    state === "session_pending" ||
    state === "loading" ||
    state === "install_first";
  const showRetryButton = state === "denied";

  return (
    <Card className="border-2 border-[#E6C699]/50 bg-[#101742] shadow-md shadow-black/25">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start gap-3">
          {state === "denied" ? (
            <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-[#94A3B8]" aria-hidden />
          ) : (
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[#E6C699]" aria-hidden />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-[#F8F9FA]">{t("notificationsCardTitle")}</p>

            {state === "loading" ? (
              <p className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {t("notificationsLoading")}
              </p>
            ) : null}

            {state === "install_first" ? (
              <p className="text-xs leading-relaxed text-[#94A3B8]">{t("notificationsInstallFirst")}</p>
            ) : null}

            {state === "session_pending" ? (
              <p className="text-xs leading-relaxed text-[#94A3B8]">{t("sessionPendingBody")}</p>
            ) : null}

            {state === "enable" ? (
              <p className="text-xs leading-relaxed text-[#94A3B8]">{t("notificationsEnableBody")}</p>
            ) : null}

            {state === "denied" ? (
              <p className="text-xs leading-relaxed text-[#94A3B8]">{t("notificationsDeniedBody")}</p>
            ) : null}

            {state === "enabled" ? (
              <p className="text-xs leading-relaxed text-[#94A3B8]">{t("notificationsEnabledBody")}</p>
            ) : null}

            {state === "unsupported" ? (
              <p className="text-xs leading-relaxed text-[#94A3B8]">{t("notificationsUnsupported")}</p>
            ) : null}

            {showEnableButton ? (
              <Button
                type="button"
                size="sm"
                disabled={busy || state === "loading"}
                onClick={() => void onEnable()}
                className="bg-[#E6C699] text-[#000225] hover:bg-[#d4b88a]"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("notificationsEnableButton")}
              </Button>
            ) : null}

            {showRetryButton ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => void onEnable()}
                className="bg-[#E6C699] text-[#000225] hover:bg-[#d4b88a]"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("notificationsRetryButton")}
              </Button>
            ) : null}

            {state === "enabled" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void onSelfTest()}
                className="border-[#2D4263] text-[#E2E8F0]"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("notificationsTestButton")}
              </Button>
            ) : null}

            {testMsg ? <p className="text-xs text-[#E6C699]">{testMsg}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
