/** Public Android APK release (keep in sync with android/app/build.gradle). */
export const ANDROID_APK_VERSION_NAME = "1.0.1";
export const ANDROID_APK_VERSION_CODE = 2;
export const ANDROID_APK_FILE_NAME = `AstarMarketplace-v${ANDROID_APK_VERSION_NAME}.apk`;
export const ANDROID_PACKAGE_ID = "com.astarmarketplace.app";

const DEFAULT_APK_PATH = `/downloads/${ANDROID_APK_FILE_NAME}`;

/** Netlify: set NEXT_PUBLIC_ANDROID_APK_URL if APK is hosted on GitHub Releases, etc. */
export function getAndroidApkDownloadUrl(): string {
  const override = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  return override || DEFAULT_APK_PATH;
}

/** @deprecated Use getAndroidApkDownloadUrl() — kept for scripts */
export const ANDROID_APK_DOWNLOAD_PATH = DEFAULT_APK_PATH;
