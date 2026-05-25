/**
 * Generate VAPID key pair for Web Push.
 * Run: node scripts/generate-vapid-keys.mjs
 * Add output to .env.local and Netlify environment variables.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\n# Web Push (PWA) — add to .env.local and Netlify:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_SUBJECT=mailto:your-email@example.com");
console.log("\nKeep VAPID_PRIVATE_KEY secret. Redeploy after setting on Netlify.\n");
