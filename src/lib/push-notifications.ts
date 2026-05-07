import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { JWT } from "google-auth-library";

type SendMessagePushArgs = {
  receiverId: string;
  senderName: string;
  contentPreview: string;
  locale: string;
  peerId: string;
};

type DevicePushTokenRow = {
  push_token: string;
};

type PushSelfTestResult = {
  ok: boolean;
  reason?: string;
  tokenCount: number;
  attempts: Array<{
    tokenSuffix: string;
    ok: boolean;
    status?: number;
    response?: string;
  }>;
};

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function trimPreview(content: string) {
  const text = content.trim().replace(/\s+/g, " ");
  if (text.length <= 96) return text;
  return `${text.slice(0, 96)}…`;
}

function readFirebaseServiceAccount(): FirebaseServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

async function getFcmAccessToken(account: FirebaseServiceAccount) {
  const jwtClient = new JWT({
    email: account.clientEmail,
    key: account.privateKey,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const tokens = await jwtClient.authorize();
  return tokens.access_token ?? null;
}

function hasInvalidTokenError(payload: string) {
  return (
    payload.includes("UNREGISTERED") ||
    payload.includes("registration token is not a valid FCM registration token")
  );
}

async function sendFcmHttpV1(args: {
  projectId: string;
  accessToken: string;
  token: string;
  title: string;
  body: string;
  path: string;
  locale: string;
  peerId: string;
  type: "new_message" | "self_test";
}) {
  return fetch(`https://fcm.googleapis.com/v1/projects/${args.projectId}/messages:send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token: args.token,
        notification: { title: args.title, body: args.body },
        data: { path: args.path, peerId: args.peerId, locale: args.locale, type: args.type },
        android: {
          priority: "high",
        },
      },
    }),
  });
}

export async function sendNewMessagePushNotification(args: SendMessagePushArgs) {
  const serviceAccount = readFirebaseServiceAccount();
  if (!serviceAccount) return;
  const accessToken = await getFcmAccessToken(serviceAccount);
  if (!accessToken) return;

  const admin = getAdminSupabaseClient();
  if (!admin) return;

  const { data: tokens, error } = await admin
    .from("device_push_tokens")
    .select("push_token")
    .eq("user_id", args.receiverId)
    .eq("platform", "android");
  if (error || !tokens || tokens.length === 0) return;

  const title = args.senderName || "New message";
  const body = trimPreview(args.contentPreview);
  const path = `/${args.locale}/messages/${args.peerId}`;

  const uniqueTokens = Array.from(new Set((tokens as DevicePushTokenRow[]).map((t) => t.push_token).filter(Boolean)));
  await Promise.all(
    uniqueTokens.map(async (token) => {
      const res = await sendFcmHttpV1({
        projectId: serviceAccount.projectId,
        accessToken,
        token,
        title,
        body,
        path,
        locale: args.locale,
        peerId: args.peerId,
        type: "new_message",
      });

      // FCM marks stale/invalid tokens; prune them to avoid repeated failures.
      if (res.ok) return;
      const errorText = await res.text().catch(() => "");
      if (hasInvalidTokenError(errorText)) {
        await admin.from("device_push_tokens").delete().eq("push_token", token);
      }
    }),
  );
}

export async function runPushSelfTest(args: { userId: string; locale: string }): Promise<PushSelfTestResult> {
  const serviceAccount = readFirebaseServiceAccount();
  if (!serviceAccount) {
    return { ok: false, reason: "Missing Firebase service account env.", tokenCount: 0, attempts: [] };
  }

  const accessToken = await getFcmAccessToken(serviceAccount);
  if (!accessToken) {
    return { ok: false, reason: "Failed to obtain FCM access token.", tokenCount: 0, attempts: [] };
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { ok: false, reason: "Missing SUPABASE_SERVICE_ROLE_KEY.", tokenCount: 0, attempts: [] };
  }

  const { data: tokens, error } = await admin
    .from("device_push_tokens")
    .select("push_token")
    .eq("user_id", args.userId)
    .eq("platform", "android");
  if (error) {
    return { ok: false, reason: error.message, tokenCount: 0, attempts: [] };
  }

  const uniqueTokens = Array.from(new Set((tokens as DevicePushTokenRow[] | null)?.map((t) => t.push_token).filter(Boolean) ?? []));
  if (uniqueTokens.length === 0) {
    return { ok: false, reason: "No Android push token found for this user.", tokenCount: 0, attempts: [] };
  }

  const attempts: PushSelfTestResult["attempts"] = [];
  for (const token of uniqueTokens) {
    const res = await sendFcmHttpV1({
      projectId: serviceAccount.projectId,
      accessToken,
      token,
      title: "Push self-test",
      body: "If you see this, mobile push is working.",
      path: `/${args.locale}/notifications`,
      locale: args.locale,
      peerId: args.userId,
      type: "self_test",
    });
    const text = await res.text().catch(() => "");
    attempts.push({
      tokenSuffix: token.slice(-10),
      ok: res.ok,
      status: res.status,
      response: text.slice(0, 400),
    });

    if (!res.ok && hasInvalidTokenError(text)) {
      await admin.from("device_push_tokens").delete().eq("push_token", token);
    }
  }

  return {
    ok: attempts.some((x) => x.ok),
    tokenCount: uniqueTokens.length,
    attempts,
    reason: attempts.some((x) => x.ok) ? undefined : "All push attempts failed.",
  };
}
