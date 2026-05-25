/** iOS distribution — App Store or TestFlight (no sideload IPA on the public website). */
export const IOS_BUNDLE_ID = "com.astarmarketplace.app";

export function getIosAppStoreUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim();
  return url || null;
}

export function getIosTestFlightUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL?.trim();
  return url || null;
}

export function hasIosPublicDownload(): boolean {
  return Boolean(getIosAppStoreUrl() || getIosTestFlightUrl());
}
