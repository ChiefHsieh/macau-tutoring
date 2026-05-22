/** Public Android APK release (keep in sync with android/app/build.gradle). */
export const ANDROID_APK_VERSION_NAME = "1.0.1";
export const ANDROID_APK_VERSION_CODE = 2;
export const ANDROID_APK_FILE_NAME = `AstarMarketplace-v${ANDROID_APK_VERSION_NAME}.apk`;
export const ANDROID_PACKAGE_ID = "com.astarmarketplace.app";

/** Only official web origin for APK distribution copy on the download page. */
export const OFFICIAL_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  "https://astarmarktetplace.netlify.app";

const DEFAULT_APK_PATH = `/downloads/${ANDROID_APK_FILE_NAME}`;

function forceHttps(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

/** Netlify: set NEXT_PUBLIC_ANDROID_APK_URL if APK is hosted on GitHub Releases, etc. */
export function getAndroidApkDownloadUrl(): string {
  const override = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  if (override) return forceHttps(override);
  return `${forceHttps(OFFICIAL_SITE_ORIGIN)}${DEFAULT_APK_PATH}`;
}

/** @deprecated Use getAndroidApkDownloadUrl() — kept for scripts */
export const ANDROID_APK_DOWNLOAD_PATH = DEFAULT_APK_PATH;
