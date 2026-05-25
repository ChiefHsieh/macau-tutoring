/** VAPID keys for Web Push (PWA). Public key is safe in the browser bundle. */

export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

export function getVapidPrivateKey(): string | null {
  const key = process.env.VAPID_PRIVATE_KEY?.trim();
  return key || null;
}

export function getVapidSubject(): string {
  return (
    process.env.VAPID_SUBJECT?.trim() || "mailto:support@astarmarktetplace.netlify.app"
  );
}

export function isWebPushConfigured(): boolean {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey());
}
