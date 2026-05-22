/**
 * Copy signed release APK → public/downloads, refresh SHA-256 checksum in repo.
 * Prerequisite: cd android && gradlew.bat assembleRelease
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const releaseApk = join(root, "android", "app", "build", "outputs", "apk", "release", "app-release.apk");
const outDir = join(root, "public", "downloads");
const version = "1.0.1";
const outName = `AstarMarketplace-v${version}.apk`;
const outFile = join(outDir, outName);
const checksumTs = join(root, "src", "lib", "android-apk-checksum.ts");

if (!existsSync(releaseApk)) {
  console.error("Missing release APK. Run: cd android && gradlew.bat assembleRelease");
  process.exit(1);
}

function sha256File(path) {
  if (process.platform === "win32") {
    const r = spawnSync("certutil", ["-hashfile", path, "SHA256"], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(r.stderr || "certutil failed");
    const line = r.stdout.split(/\r?\n/).find((l) => /^[a-fA-F0-9]{64}$/.test(l.trim()));
    if (!line) throw new Error("Could not parse certutil SHA256 output");
    return line.trim().toLowerCase();
  }
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

mkdirSync(outDir, { recursive: true });
copyFileSync(releaseApk, outFile);
const hash = sha256File(outFile);

writeFileSync(
  checksumTs,
  `/**
 * SHA-256 of the published APK (auto-updated by npm run publish:android-apk).
 * Users can verify: certutil -hashfile ${outName} SHA256
 */
export const ANDROID_APK_SHA256 =
  "${hash}";
`,
  "utf8",
);

writeFileSync(
  join(outDir, "checksums.json"),
  JSON.stringify({ file: outName, version, sha256: hash, updatedAt: new Date().toISOString() }, null, 2),
  "utf8",
);

console.log(`Copied → public/downloads/${outName}`);
console.log(`SHA-256: ${hash}`);
console.log(`Updated → src/lib/android-apk-checksum.ts`);
