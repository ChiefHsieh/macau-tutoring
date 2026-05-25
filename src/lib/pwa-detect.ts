/** Client-only PWA / iOS Safari helpers (no Capacitor native). */

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

export function isIosSafariForPwa(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIos) return false;
  const isOtherBrowser = /CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return !isOtherBrowser;
}

export function shouldShowIosInstallBanner(): boolean {
  return isIosSafariForPwa() && !isStandaloneDisplayMode() && !isCapacitorNative();
}
