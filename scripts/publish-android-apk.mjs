/**
 * Copy signed release APK into public/downloads for Netlify hosting.
 * Prerequisite: cd android && gradlew.bat assembleRelease
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const releaseApk = join(root, "android", "app", "build", "outputs", "apk", "release", "app-release.apk");
const outDir = join(root, "public", "downloads");
const outFile = join(outDir, "AstarMarketplace-v1.0.1.apk");

if (!existsSync(releaseApk)) {
  console.error("Missing release APK. Run: cd android && gradlew.bat assembleRelease");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(releaseApk, outFile);
console.log(`Copied → public/downloads/AstarMarketplace-v1.0.1.apk`);
