import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { isWebPushConfigured } from "@/lib/vapid-config";
import { isExpiredWebPushError, sendWebPushNotification } from "@/lib/web-push-send";
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

type PushAttempt = {
  platform: "android" | "web";
  tokenSuffix: string;
  ok: boolean;
  status?: number;
  response?: string;
};

export type PushSelfTestResult = {
  ok: boolean;
  reason?: string;
  tokenCount: number;
  attempts: PushAttempt[];
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

function hasInvalidFcmTokenError(payload: string) {
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

async function sendFcmToUser(args: {
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>;
  userId: string;
  title: string;
  body: string;
  path: string;
  locale: string;
  peerId: string;
  type: "new_message" | "self_test";
}) {
  const serviceAccount = readFirebaseServiceAccount();
  if (!serviceAccount) return;

  const accessToken = await getFcmAccessToken(serviceAccount);
  if (!accessToken) return;

  const { data: tokens, error } = await args.admin
    .from("device_push_tokens")
    .select("push_token")
    .eq("user_id", args.userId)
    .eq("platform", "android");
  if (error || !tokens?.length) return;

  const uniqueTokens = Array.from(
    new Set((tokens as DevicePushTokenRow[]).map((t) => t.push_token).filter(Boolean)),
  );

  await Promise.all(
    uniqueTokens.map(async (token) => {
      const res = await sendFcmHttpV1({
        projectId: serviceAccount.projectId,
        accessToken,
        token,
        title: args.title,
        body: args.body,
        path: args.path,
        locale: args.locale,
        peerId: args.peerId,
        type: args.type,
      });

      if (res.ok) return;
      const errorText = await res.text().catch(() => "");
      if (hasInvalidFcmTokenError(errorText)) {
        await args.admin.from("device_push_tokens").delete().eq("push_token", token);
      }
    }),
  );
}

async function sendWebPushToUser(args: {
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>;
  userId: string;
  title: string;
  body: string;
  path: string;
}) {
  if (!isWebPushConfigured()) return;

  const { data: tokens, error } = await args.admin
    .from("device_push_tokens")
    .select("push_token")
    .eq("user_id", args.userId)
    .eq("platform", "web");
  if (error || !tokens?.length) return;

  const uniqueTokens = Array.from(
    new Set((tokens as DevicePushTokenRow[]).map((t) => t.push_token).filter(Boolean)),
  );

  await Promise.all(
    uniqueTokens.map(async (token) => {
      const result = await sendWebPushNotification(token, {
        title: args.title,
        body: args.body,
        url: args.path,
      });

      if (result.ok) return;
      if (isExpiredWebPushError({ statusCode: result.statusCode })) {
        await args.admin.from("device_push_tokens").delete().eq("push_token", token);
      }
    }),
  );
}

export async function sendNewMessagePushNotification(args: SendMessagePushArgs) {
  const admin = getAdminSupabaseClient();
  if (!admin) return;

  const title = args.senderName || "New message";
  const body = trimPreview(args.contentPreview);
  const path = `/${args.locale}/messages/${args.peerId}`;

  await Promise.all([
    sendFcmToUser({
      admin,
      userId: args.receiverId,
      title,
      body,
      path,
      locale: args.locale,
      peerId: args.peerId,
      type: "new_message",
    }),
    sendWebPushToUser({
      admin,
      userId: args.receiverId,
      title,
      body,
      path,
    }),
  ]);
}

async function runFcmSelfTest(
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  args: { userId: string; locale: string },
): Promise<PushAttempt[]> {
  const serviceAccount = readFirebaseServiceAccount();
  if (!serviceAccount) return [];

  const accessToken = await getFcmAccessToken(serviceAccount);
  if (!accessToken) return [];

  const { data: tokens, error } = await admin
    .from("device_push_tokens")
    .select("push_token")
    .eq("user_id", args.userId)
    .eq("platform", "android");
  if (error || !tokens?.length) return [];

  const uniqueTokens = Array.from(
    new Set((tokens as DevicePushTokenRow[]).map((t) => t.push_token).filter(Boolean)),
  );

  const attempts: PushAttempt[] = [];
  const path = `/${args.locale}/notifications`;

  for (const token of uniqueTokens) {
    const res = await sendFcmHttpV1({
      projectId: serviceAccount.projectId,
      accessToken,
      token,
      title: "Push self-test",
      body: "If you see this, Android push is working.",
      path,
      locale: args.locale,
      peerId: args.userId,
      type: "self_test",
    });
    const text = await res.text().catch(() => "");
    attempts.push({
      platform: "android",
      tokenSuffix: token.slice(-10),
      ok: res.ok,
      status: res.status,
      response: text.slice(0, 400),
    });

    if (!res.ok && hasInvalidFcmTokenError(text)) {
      await admin.from("device_push_tokens").delete().eq("push_token", token);
    }
  }

  return attempts;
}

async function runWebPushSelfTest(
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  args: { userId: string; locale: string },
): Promise<PushAttempt[]> {
  if (!isWebPushConfigured()) return [];

  const { data: tokens, error } = await admin
    .from("device_push_tokens")
    .select("push_token")
    .eq("user_id", args.userId)
    .eq("platform", "web");
  if (error || !tokens?.length) return [];

  const uniqueTokens = Array.from(
    new Set((tokens as DevicePushTokenRow[]).map((t) => t.push_token).filter(Boolean)),
  );

  const attempts: PushAttempt[] = [];
  const path = `/${args.locale}/notifications`;

  for (const token of uniqueTokens) {
    const result = await sendWebPushNotification(token, {
      title: "Push self-test",
      body: "If you see this, PWA Web Push is working.",
      url: path,
    });

    attempts.push({
      platform: "web",
      tokenSuffix: token.slice(-12),
      ok: result.ok,
      status: result.statusCode,
      response: result.body,
    });

    if (!result.ok && isExpiredWebPushError({ statusCode: result.statusCode })) {
      await admin.from("device_push_tokens").delete().eq("push_token", token);
    }
  }

  return attempts;
}

export async function runPushSelfTest(args: { userId: string; locale: string }): Promise<PushSelfTestResult> {
  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { ok: false, reason: "Missing SUPABASE_SERVICE_ROLE_KEY.", tokenCount: 0, attempts: [] };
  }

  const [fcmAttempts, webAttempts] = await Promise.all([
    runFcmSelfTest(admin, args),
    runWebPushSelfTest(admin, args),
  ]);

  const attempts = [...fcmAttempts, ...webAttempts];
  const tokenCount = attempts.length;

  if (tokenCount === 0) {
    const reasons: string[] = [];
    if (!readFirebaseServiceAccount()) reasons.push("no Firebase config");
    if (!isWebPushConfigured()) reasons.push("no VAPID config");
    return {
      ok: false,
      reason: `No push tokens for this user (${reasons.join("; ") || "subscribe first"}).`,
      tokenCount: 0,
      attempts: [],
    };
  }

  const ok = attempts.some((x) => x.ok);
  return {
    ok,
    tokenCount,
    attempts,
    reason: ok ? undefined : "All push attempts failed.",
  };
}
