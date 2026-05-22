/**
 * Smoke-test download portal (local or production).
 * Usage: node scripts/verify-download-portal.mjs
 *        BASE_URL=https://astarmarktetplace.netlify.app node scripts/verify-download-portal.mjs
 */
const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const apkName = "AstarMarketplace-v1.0.1.apk";

const checks = [
  { name: "home zh-HK", url: `${base}/zh-HK`, mustInclude: ["/zh-HK/download", "Android"] },
  {
    name: "download zh-HK",
    url: `${base}/zh-HK/download`,
    mustInclude: ["下載 Android", apkName, "SHA-256", "bc5f2d88fec361f2da1baa864030ddd6d7d987fd8a71c2efd8470e2e9a38f857"],
  },
  { name: "download en", url: `${base}/en/download`, mustInclude: ["Download Android", apkName] },
  { name: "apk file", url: `${base}/downloads/${apkName}`, head: true, minBytes: 1_000_000 },
];

let failed = 0;

for (const c of checks) {
  try {
    const res = await fetch(c.url, c.head ? { method: "HEAD" } : {});
    if (!res.ok) {
      console.error(`FAIL ${c.name}: HTTP ${res.status} ${c.url}`);
      failed++;
      continue;
    }
    if (c.head) {
      const len = Number(res.headers.get("content-length") ?? 0);
      if (c.minBytes && len < c.minBytes) {
        console.error(`FAIL ${c.name}: size ${len} < ${c.minBytes} ${c.url}`);
        failed++;
        continue;
      }
      console.log(`OK   ${c.name}: ${res.status} (${len} bytes)`);
      continue;
    }
    const html = await res.text();
    const missing = (c.mustInclude ?? []).filter((s) => !html.includes(s));
    if (missing.length) {
      console.error(`FAIL ${c.name}: missing ${missing.join(", ")} ${c.url}`);
      failed++;
      continue;
    }
    console.log(`OK   ${c.name}: ${res.status}`);
  } catch (e) {
    console.error(`FAIL ${c.name}: ${e.message} ${c.url}`);
    failed++;
  }
}

if (failed) process.exit(1);
console.log("\nAll download portal checks passed.");
